from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re

app = FastAPI(title="Cyberconsciente API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextRequest(BaseModel):
    text: str


@app.get("/")
def root():
    return {"status": "ok", "project": "Cyberconsciente"}


# ─── TEXT DETECTION ────────────────────────────────────────────────────────────

@app.post("/detect/text")
def detect_text(req: TextRequest):
    text = req.text.strip()
    if len(text) < 20:
        raise HTTPException(status_code=400, detail="Texto muito curto. Mínimo de 20 caracteres.")

    score, signals = _analyze_text(text)

    verdict = "IA" if score > 50 else "HUMANO"
    confidence = score if verdict == "IA" else (100 - score)

    return {
        "verdict": verdict,
        "ai_score": round(score, 1),
        "human_score": round(100 - score, 1),
        "confidence": round(confidence, 1),
        "signals": signals,
    }


def _analyze_text(text: str):
    """Multi-heuristic AI text detection. Returns (score 0-100, signals)."""
    import math

    signals = []
    score = 0.0
    words = text.split()
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]

    total_factors = 0

    # ── 1. Formal connectives (AI loves these)
    connectives = [
        "além disso", "portanto", "no entanto", "ademais", "outrossim",
        "dessa forma", "por conseguinte", "em suma", "em conclusão",
        "furthermore", "moreover", "however", "therefore", "additionally",
        "in conclusion", "as a result", "it is worth noting",
    ]
    found_conn = [c for c in connectives if c.lower() in text.lower()]
    conn_ratio = len(found_conn) / max(len(sentences), 1)
    if conn_ratio > 0.4:
        score += 20
        signals.append({"label": f"Muitos conectivos formais ({len(found_conn)} encontrados)", "type": "ai"})
    elif found_conn:
        score += 8
        signals.append({"label": "Alguns conectivos formais", "type": "ai"})
    else:
        signals.append({"label": "Linguagem direta, poucos conectivos", "type": "human"})
    total_factors += 20

    # ── 2. Sentence length uniformity (AI tends to be uniform)
    if len(sentences) >= 3:
        lengths = [len(s.split()) for s in sentences]
        mean_len = sum(lengths) / len(lengths)
        variance = sum((l - mean_len) ** 2 for l in lengths) / len(lengths)
        std_dev = math.sqrt(variance)
        uniformity = std_dev / max(mean_len, 1)

        if uniformity < 0.25:
            score += 18
            signals.append({"label": "Frases muito uniformes em tamanho", "type": "ai"})
        elif uniformity > 0.5:
            signals.append({"label": "Variação natural no tamanho das frases", "type": "human"})
        else:
            score += 8
        total_factors += 18

    # ── 3. Lexical diversity (TTR - Type-Token Ratio)
    lower_words = [w.lower().strip(".,!?;:\"'()") for w in words]
    ttr = len(set(lower_words)) / max(len(lower_words), 1)
    if ttr < 0.45:
        score += 15
        signals.append({"label": "Baixa diversidade lexical (repetições)", "type": "ai"})
    elif ttr > 0.75:
        signals.append({"label": "Vocabulário rico e diversificado", "type": "human"})
    else:
        score += 5
    total_factors += 15

    # ── 4. Perfect structure: intro + dev + conclusion pattern
    lower = text.lower()
    intro_markers = ["introdução", "introduction", "neste texto", "neste artigo", "this essay", "this article"]
    concl_markers = ["conclusão", "conclusion", "em conclusão", "portanto, conclui-se", "in summary", "to summarize"]
    has_intro = any(m in lower for m in intro_markers)
    has_concl = any(m in lower for m in concl_markers)
    if has_intro and has_concl:
        score += 15
        signals.append({"label": "Estrutura intro-desenvolvimento-conclusão", "type": "ai"})
    elif has_intro or has_concl:
        score += 7
    total_factors += 15

    # ── 5. Impersonal / passive voice patterns
    impersonal = [
        "é importante", "é necessário", "é fundamental", "é essencial",
        "it is important", "it is necessary", "it should be noted",
        "deve-se", "pode-se", "sabe-se que",
    ]
    found_imp = sum(1 for p in impersonal if p in lower)
    if found_imp >= 2:
        score += 12
        signals.append({"label": "Linguagem impessoal e genérica", "type": "ai"})
    elif found_imp == 1:
        score += 5
    else:
        signals.append({"label": "Estilo pessoal e direto", "type": "human"})
    total_factors += 12

    # ── 6. Emotional / informal markers (human signals)
    informal = [
        "!", "haha", "kkkk", "rsrs", "né", "cara", "gente", "mds",
        "lol", "omg", "btw", "imo", "tbh", "ngl", "wtf",
    ]
    found_inf = sum(1 for m in informal if m in lower)
    if found_inf >= 2:
        score -= 15
        signals.append({"label": "Expressões informais / emocionais", "type": "human"})
    elif found_inf == 1:
        score -= 7

    # ── 7. Repetitive sentence starters
    starters = [s.split()[0].lower() if s.split() else "" for s in sentences]
    if len(starters) >= 4:
        from collections import Counter
        top_starter, top_count = Counter(starters).most_common(1)[0]
        if top_count / len(starters) > 0.4:
            score += 10
            signals.append({"label": f"Início de frases repetido ('{top_starter}')", "type": "ai"})

    # ── Clamp to 5–95
    score = max(5, min(95, score))
    return score, signals


# ─── IMAGE DETECTION ───────────────────────────────────────────────────────────

@app.post("/detect/image")
async def detect_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Envie um arquivo de imagem válido.")

    try:
        from PIL import Image
        import io

        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        score, signals = _analyze_image(image)
        verdict = "IA" if score > 50 else "HUMANO"

        return {
            "verdict": verdict,
            "ai_score": round(score, 1),
            "human_score": round(100 - score, 1),
            "confidence": round(max(score, 100 - score), 1),
            "signals": signals,
            "filename": file.filename,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {str(e)}")


def _analyze_image(image):
    """Multi-heuristic AI image detection. Returns (score 0-100, signals)."""
    import numpy as np

    img = np.array(image).astype(float)
    signals = []
    score = 0.0

    # ── 1. Color channel correlation (AI images have very high channel correlation)
    r, g, b = img[:, :, 0], img[:, :, 1], img[:, :, 2]
    rg_corr = float(np.corrcoef(r.flatten(), g.flatten())[0, 1])
    if rg_corr > 0.97:
        score += 22
        signals.append({"label": "Correlação de cores muito alta (sintética)", "type": "ai"})
    elif rg_corr > 0.90:
        score += 10
        signals.append({"label": "Correlação de cores elevada", "type": "ai"})
    else:
        signals.append({"label": "Variação de cor orgânica", "type": "human"})

    # ── 2. Noise texture analysis (real photos have sensor noise)
    gray = np.mean(img, axis=2)
    # High-frequency noise via Laplacian approximation
    laplacian = (
        -gray[:-2, 1:-1] - gray[2:, 1:-1] - gray[1:-1, :-2] - gray[1:-1, 2:]
        + 4 * gray[1:-1, 1:-1]
    )
    noise_std = float(np.std(laplacian))
    if noise_std < 4.0:
        score += 20
        signals.append({"label": "Textura suave demais (sem ruído de sensor)", "type": "ai"})
    elif noise_std > 12.0:
        signals.append({"label": "Ruído natural de câmera detectado", "type": "human"})
    else:
        score += 8

    # ── 3. Symmetry analysis
    half = img.shape[1] // 2
    left = img[:, :half, :]
    right = np.fliplr(img[:, img.shape[1] - half:, :])
    min_w = min(left.shape[1], right.shape[1])
    sym_score = float(np.mean(np.abs(left[:, :min_w] - right[:, :min_w])))
    if sym_score < 12:
        score += 18
        signals.append({"label": "Alta simetria bilateral (padrão de IA)", "type": "ai"})
    elif sym_score > 30:
        signals.append({"label": "Assimetria natural detectada", "type": "human"})
    else:
        score += 7

    # ── 4. Edge sharpness uniformity (AI: unnaturally uniform edges)
    gy = np.abs(gray[1:, :] - gray[:-1, :])
    gx = np.abs(gray[:, 1:] - gray[:, :-1])
    edge_mean = float(np.mean(gy)) + float(np.mean(gx))
    edge_std = float(np.std(gy)) + float(np.std(gx))
    edge_cv = edge_std / max(edge_mean, 0.001)
    if edge_cv < 1.5:
        score += 15
        signals.append({"label": "Bordas excessivamente uniformes", "type": "ai"})
    else:
        signals.append({"label": "Variação natural nas bordas", "type": "human"})

    # ── 5. Perfect aspect ratio
    w, h = image.size
    ratio = w / h
    perfect_ratios = [(1, 1), (16, 9), (4, 3), (3, 2), (9, 16)]
    is_perfect = any(abs(ratio - a / b) < 0.02 for a, b in perfect_ratios)
    if is_perfect and w >= 512:
        score += 10
        signals.append({"label": f"Proporção perfeita {w}×{h} (gerada por IA)", "type": "ai"})
    else:
        signals.append({"label": "Proporção irregular (foto natural)", "type": "human"})

    # ── Clamp
    score = max(5, min(95, score))
    return score, signals
