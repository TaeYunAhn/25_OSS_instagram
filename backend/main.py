from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, EmailStr
import bcrypt

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