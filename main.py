from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import webbrowser
from contextlib import asynccontextmanager

# CONFIGURAÇÃO DO SQLALCHEMY (Banco de Dados)
SQLALCHEMY_DATABASE_URL = "sqlite:///./biblioteca.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# TABELA DO BANCO DE DADOS
class LivroDB(Base):
    __tablename__ = "livros"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, index=True)
    autor = Column(String)
    url_imagem = Column(String)
    disponivel = Column(Boolean, default=True)

# Cria a tabela automaticamente se não existir
Base.metadata.create_all(bind=engine)

# MODELO DE DADOS (JSON do Front-end)
class Livro(BaseModel):
    titulo: str
    autor: str
    url_imagem: str
    disponivel: bool

# FUNÇÃO QUE ABRE O NAVEGADOR SOZINHO (Nas tabelas do Swagger)
@asynccontextmanager
async def lifespan(app: FastAPI):
    webbrowser.open("http://127.0.0.1:8000/docs")
    yield

# INICIALIZA O FASTAPI COM O NAVEGADOR AUTOMÁTICO
app = FastAPI(title="API Biblioteca Comunitária - SENAI", lifespan=lifespan)

# PERMISSÃO PARA O HTML CONVERSAR COM O PYTHON
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- REDIRECIONA A ROTA RAIZ PARA AS TABELAS ---
@app.get("/", include_in_schema=False)
def pagina_inicial():
    return RedirectResponse(url="/docs")

# ==========================================
# ROTAS (Endpoints do CRUD)
# ==========================================

# 1. LISTAR TODOS OS LIVROS
@app.get("/livros")
def listar_livros(db: Session = Depends(get_db)):
    livros = db.query(LivroDB).all()
    return {"dados": livros}

# 2. BUSCAR UM LIVRO ESPECÍFICO PELO ID 
@app.get("/livros/{id}")
def buscar_livro_por_id(id: int, db: Session = Depends(get_db)):
    livro = db.query(LivroDB).filter(LivroDB.id == id).first()
    if not livro:
        raise HTTPException(status_code=404, detail="Livro não encontrado")
    return livro

# 3. ADICIONAR UM NOVO LIVRO
@app.post("/livros")
def adicionar_livro(livro: Livro, db: Session = Depends(get_db)):
    novo_livro = LivroDB(
        titulo=livro.titulo,
        autor=livro.autor,
        url_imagem=livro.url_imagem,
        disponivel=livro.disponivel
    )
    db.add(novo_livro)
    db.commit()
    db.refresh(novo_livro)
    return {"mensagem": "Livro adicionado!", "id": novo_livro.id}

# 4. ATUALIZAR UM LIVRO EXISTENTE
@app.put("/livros/{id}")
def atualizar_livro(id: int, livro_atualizado: Livro, db: Session = Depends(get_db)):
    livro = db.query(LivroDB).filter(LivroDB.id == id).first()
    if not livro:
        raise HTTPException(status_code=404, detail="Livro não encontrado")
    
    livro.titulo = livro_atualizado.titulo
    livro.autor = livro_atualizado.autor
    livro.url_imagem = livro_atualizado.url_imagem
    livro.disponivel = livro_atualizado.disponivel
    
    db.commit()
    return {"mensagem": "Livro atualizado!"}

# 5. DELETAR UM LIVRO
@app.delete("/livros/{id}")
def deletar_livro(id: int, db: Session = Depends(get_db)):
    livro = db.query(LivroDB).filter(LivroDB.id == id).first()
    if not livro:
        raise HTTPException(status_code=404, detail="Livro não encontrado")
    
    db.delete(livro)
    db.commit()
    return {"mensagem": "Livro removido!"}