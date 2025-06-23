from fastapi import FastAPI
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

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

@app.get("/")
def read_root():
    return {"message": "Hello, Instagram Clone!"}

# DB 테이블 생성
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine) 