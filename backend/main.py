from fastapi import FastAPI, HTTPException, Depends, File, UploadFile
from sqlalchemy import Column, Integer, String, create_engine, and_
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, EmailStr
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from fastapi import status
from typing import List, Optional
import os

app = FastAPI()

DATABASE_URL = "sqlite:///./insta_clone.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    nickname = Column(String, nullable=True)
    profile_image = Column(String, nullable=True)

# Pydantic 모델
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    nickname: str = None
    profile_image: str = None

class UserOut(BaseModel):
    id: int
    email: EmailStr
    username: str
    nickname: str = None
    profile_image: str = None
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class Feed(Base):
    __tablename__ = "feeds"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    content = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())
    updated_at = Column(String, default=lambda: datetime.utcnow().isoformat())

class FeedCreate(BaseModel):
    content: Optional[str] = None

class FeedOut(BaseModel):
    id: int
    user_id: int
    content: Optional[str] = None
    image_url: Optional[str] = None
    created_at: str
    updated_at: str
    class Config:
        from_attributes = True

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    feed_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())

class CommentCreate(BaseModel):
    feed_id: int
    content: str

class CommentOut(BaseModel):
    id: int
    feed_id: int
    user_id: int
    content: str
    created_at: str
    class Config:
        from_attributes = True

class Like(Base):
    __tablename__ = "likes"
    id = Column(Integer, primary_key=True, index=True)
    feed_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)

# 팔로우 모델
class Follow(Base):
    __tablename__ = "follows"
    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, nullable=False)  # 팔로우하는 사람
    following_id = Column(Integer, nullable=False)  # 팔로우 받는 사람

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Hello, Instagram Clone!"}

# DB 테이블 생성
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

@app.post("/signup", response_model=UserOut)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # 중복 체크
    if db.query(User).filter((User.email == user.email) | (User.username == user.username)).first():
        raise HTTPException(status_code=400, detail="이미 존재하는 이메일 또는 사용자명입니다.")
    # 비밀번호 암호화
    hashed_pw = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    db_user = User(
        email=user.email,
        username=user.username,
        password=hashed_pw.decode('utf-8'),
        nickname=user.nickname,
        profile_image=user.profile_image
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login", response_model=Token)
def login(form_data: UserCreate, db: Session = Depends(get_db)):
    # email 또는 username으로 사용자 조회
    user = db.query(User).filter(
        (User.email == form_data.email) | (User.username == form_data.username)
    ).first()
    if not user:
        raise HTTPException(status_code=400, detail="존재하지 않는 사용자입니다.")
    # 비밀번호 검증
    if not bcrypt.checkpw(form_data.password.encode('utf-8'), user.password.encode('utf-8')):
        raise HTTPException(status_code=400, detail="비밀번호가 일치하지 않습니다.")
    # JWT 토큰 생성
    to_encode = {"sub": str(user.id), "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)}
    access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": access_token, "token_type": "bearer"}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# JWT 토큰에서 사용자 정보 추출
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

# 인증 테스트용 엔드포인트
@app.get("/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# 게시글 작성
@app.post("/feeds", response_model=FeedOut)
async def create_feed(
    content: Optional[str] = None,
    image: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    image_url = None
    if image:
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, image.filename)
        with open(file_path, "wb") as f:
            f.write(await image.read())
        image_url = f"/{file_path}"
    now = datetime.utcnow().isoformat()
    db_feed = Feed(
        user_id=current_user.id,
        content=content,
        image_url=image_url,
        created_at=now,
        updated_at=now
    )
    db.add(db_feed)
    db.commit()
    db.refresh(db_feed)
    return db_feed

# 게시글 전체 조회
@app.get("/feeds", response_model=List[FeedOut])
async def get_feeds(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return db.query(Feed).order_by(Feed.created_at.desc()).offset(skip).limit(limit).all()

# 게시글 단일 조회
@app.get("/feeds/{feed_id}", response_model=FeedOut)
async def get_feed(feed_id: int, db: Session = Depends(get_db)):
    feed = db.query(Feed).filter(Feed.id == feed_id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    return feed

# 게시글 수정
@app.put("/feeds/{feed_id}", response_model=FeedOut)
async def update_feed(
    feed_id: int,
    content: Optional[str] = None,
    image: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    feed = db.query(Feed).filter(Feed.id == feed_id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    if feed.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")
    if content is not None:
        feed.content = content
    if image:
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, image.filename)
        with open(file_path, "wb") as f:
            f.write(await image.read())
        feed.image_url = f"/{file_path}"
    feed.updated_at = datetime.utcnow().isoformat()
    db.commit()
    db.refresh(feed)
    return feed

# 게시글 삭제
@app.delete("/feeds/{feed_id}")
async def delete_feed(feed_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    feed = db.query(Feed).filter(Feed.id == feed_id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    if feed.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    db.delete(feed)
    db.commit()
    return {"message": "삭제되었습니다."}

# 댓글 작성
@app.post("/comments", response_model=CommentOut)
async def create_comment(
    comment: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_comment = Comment(
        feed_id=comment.feed_id,
        user_id=current_user.id,
        content=comment.content,
        created_at=datetime.utcnow().isoformat()
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

# 피드별 댓글 조회
@app.get("/feeds/{feed_id}/comments", response_model=List[CommentOut])
async def get_comments(feed_id: int, db: Session = Depends(get_db)):
    return db.query(Comment).filter(Comment.feed_id == feed_id).order_by(Comment.created_at.asc()).all()

# 댓글 삭제
@app.delete("/comments/{comment_id}")
async def delete_comment(comment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    db.delete(comment)
    db.commit()
    return {"message": "삭제되었습니다."}

# 좋아요 토글
@app.post("/feeds/{feed_id}/like")
async def toggle_like(feed_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    like = db.query(Like).filter(and_(Like.feed_id == feed_id, Like.user_id == current_user.id)).first()
    if like:
        db.delete(like)
        db.commit()
        return {"message": "좋아요 취소"}
    else:
        new_like = Like(feed_id=feed_id, user_id=current_user.id)
        db.add(new_like)
        db.commit()
        return {"message": "좋아요"}

# 피드별 좋아요 개수 조회
@app.get("/feeds/{feed_id}/likes")
async def get_like_count(feed_id: int, db: Session = Depends(get_db)):
    count = db.query(Like).filter(Like.feed_id == feed_id).count()
    return {"count": count}

# 팔로우 토글
@app.post("/users/{user_id}/follow")
async def toggle_follow(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="자신을 팔로우할 수 없습니다.")
    
    follow = db.query(Follow).filter(and_(Follow.follower_id == current_user.id, Follow.following_id == user_id)).first()
    if follow:
        db.delete(follow)
        db.commit()
        return {"message": "언팔로우"}
    else:
        new_follow = Follow(follower_id=current_user.id, following_id=user_id)
        db.add(new_follow)
        db.commit()
        return {"message": "팔로우"}

# 팔로워 개수 조회
@app.get("/users/{user_id}/followers/count")
async def get_follower_count(user_id: int, db: Session = Depends(get_db)):
    count = db.query(Follow).filter(Follow.following_id == user_id).count()
    return {"count": count}

# 팔로잉 개수 조회
@app.get("/users/{user_id}/following/count")
async def get_following_count(user_id: int, db: Session = Depends(get_db)):
    count = db.query(Follow).filter(Follow.follower_id == user_id).count()
    return {"count": count}

# 팔로워 목록 조회
@app.get("/users/{user_id}/followers")
async def get_followers(user_id: int, db: Session = Depends(get_db)):
    followers = db.query(Follow).filter(Follow.following_id == user_id).all()
    user_ids = [f.follower_id for f in followers]
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    return users

# 팔로잉 목록 조회
@app.get("/users/{user_id}/following")
async def get_following(user_id: int, db: Session = Depends(get_db)):
    following = db.query(Follow).filter(Follow.follower_id == user_id).all()
    user_ids = [f.following_id for f in following]
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    return users 