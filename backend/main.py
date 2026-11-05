from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re
import math
import os
from collections import Counter

app = FastAPI(title="Cyberconsciente API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextRequest(BaseModel):
    text: str


# ─── ROOT ──────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "project": "Cyberconsciente", "version": "2.0"}


# ─── LANGUAGE DETECTION ────────────────────────────────────────────────────────

def _detect_language(text: str) -> str:
    """Detect language using langdetect. Returns 'pt', 'en', or 'other'."""
    try:
        from langdetect import detect
        lang = detect(text)
        if lang == "pt":
            return "pt"
        elif lang == "en":
            return "en"
        else:
            return "other"
    except Exception:
        return "other"


# ─── TEXT ANALYSIS ─────────────────────────────────────────────────────────────

def _analyze_text(text: str, language: str = "other"):
    """Multi-factor linguistic & rhetorical AI text detection.
    Evaluates LLM tropes, syntactic symmetry, burstiness, and lexical entropy.
    Returns (score 0-100, signals).
    """
    signals = []
    lower = text.lower()
    words = text.split()
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    
    # Base prior for neutral text
    score = 25.0

    # ── 1. Myth vs. Reality / Debunking Trope (classic ChatGPT intro)
    myth_pt = r'(muita gente|muitas pessoas|muitos|comumente|acredita-se que|é comum pensar)\s+.+?(mas\s+(a ciência|estudos|pesquisas|na verdade|o que poucos sabem)|,?\s*no entanto)'
    myth_en = r'(many people|it is commonly believed|one might think|popular belief)\s+.+?(however|but in reality|studies show|science suggests)'
    myth_pat = myth_pt if language == "pt" else (myth_en if language == "en" else f"({myth_pt}|{myth_en})")
    if re.search(myth_pat, lower):
        score += 26
        signals.append({"label": "Padrão retórico de desmistificação ('muitos acreditam... mas a ciência mostra')", "type": "ai"})

    # ── 2. Binary Antithesis ('não apenas X, mas também Y' ou 'não é X, e sim Y')
    anti_pt = r'não\s+(é|apenas|só|somente|se trata de).+?,?\s+(e sim|mas também|mas sim|mas de)'
    anti_en = r'not\s+(only|just|merely|simply).+?,?\s+(but also|but rather|and rather)'
    anti_pat = anti_pt if language == "pt" else (anti_en if language == "en" else f"({anti_pt}|{anti_en})")
    if re.search(anti_pat, lower):
        score += 24
        signals.append({"label": "Contraste binário característico de LLMs ('não é X, e sim Y')", "type": "ai"})

    # ── 3. Didactic Actionable List with Colon (AI loves giving bullet points in prose)
    list_pt = r'(algumas|alguns|as principais|dicas|atitudes|estratégias|orientações|recomendações|passos)\s+.+?:\s*.+?(\b\w+ar\b|\b\w+er\b|\b\w+ir\b)'
    list_en = r'(some tips|key strategies|actions|steps|recommendations)\s+.+?:\s*.+?(\b\w+ing\b|\bto \w+\b)'
    list_pat = list_pt if language == "pt" else (list_en if language == "en" else f"({list_pt}|{list_en})")
    if re.search(list_pat, lower):
        score += 22
        signals.append({"label": "Estrutura didática de recomendações em lista após dois-pontos", "type": "ai"})

    # ── 4. Cliché Superlative Hook
    hook_pt = r'\b(é um dos|é uma das|figura entre os|são fundamentais para quem)\s+(principais|mais|maiores|hábitos|fatores|pilares|desafios)\b'
    hook_en = r'\b(is one of the most|plays a crucial role in|serves as a cornerstone|is an essential)\b'
    hook_pat = hook_pt if language == "pt" else (hook_en if language == "en" else f"({hook_pt}|{hook_en})")
    if re.search(hook_pat, lower):
        score += 18
        signals.append({"label": "Abertura em fórmula de gancho didático ('é um dos hábitos mais...')", "type": "ai"})

    # ── 5. Textbook Conceptual Definition
    def_pt = r'\b(esse processo se chama|trata-se de|isso ocorre porque|isso acontece quando|em outras palavras|denomina-se)\b'
    def_en = r'\b(this process is known as|this occurs because|in other words|refers to the)\b'
    def_pat = def_pt if language == "pt" else (def_en if language == "en" else f"({def_pt}|{def_en})")
    if re.search(def_pat, lower):
        score += 16
        signals.append({"label": "Definição conceitual em formato de livro didático ('esse processo se chama')", "type": "ai"})

    # ── 6. Standardized Summary / Conclusion
    concl_pt = r'\b(em resumo|em conclusão|em suma|por fim|em síntese|conclui-se que)\b'
    concl_en = r'\b(in summary|in conclusion|to sum up|ultimately|in essence|in short)\b'
    concl_pat = concl_pt if language == "pt" else (concl_en if language == "en" else f"({concl_pt}|{concl_en})")
    if re.search(concl_pat, lower):
        score += 20
        signals.append({"label": "Fechamento conclusivo padronizado ('Em resumo...')", "type": "ai"})

    # ── 7. Transition Connective Density
    trans_pt = r'\b(por isso|portanto|além disso|dessa forma|no entanto|nesse sentido|por conseguinte|sob essa perspectiva)\b'
    trans_en = r'\b(therefore|furthermore|moreover|however|as a result|consequently|additionally)\b'
    trans_pat = trans_pt if language == "pt" else (trans_en if language == "en" else f"({trans_pt}|{trans_en})")
    trans_count = len(re.findall(trans_pat, lower))
    if trans_count >= 2:
        score += 15
        signals.append({"label": f"Alta densidade de transições conectivas ({trans_count} detectadas)", "type": "ai"})

    # ── 8. Sentence Length Uniformity / Low Burstiness
    if len(sentences) >= 3:
        lens = [len(s.split()) for s in sentences]
        mean_l = sum(lens) / len(lens)
        sd = math.sqrt(sum((l - mean_l)**2 for l in lens) / len(lens))
        cv = sd / max(mean_l, 1)
        if cv < 0.45:
            score += 16
            signals.append({"label": "Cadência sintática uniforme e contínua (baixa variação de ritmo)", "type": "ai"})
        elif cv > 0.70:
            score -= 15
            signals.append({"label": "Variação orgânica no tamanho e ritmo das frases", "type": "human"})

    # ── 9. Lexical Diversity (TTR)
    clean_words = [w.strip(".,!?;:\"'()").lower() for w in words if len(w) > 2]
    if clean_words:
        ttr = len(set(clean_words)) / len(clean_words)
        if ttr < 0.45:
            score += 10
            signals.append({"label": "Baixa variedade vocabular (repetições contínuas)", "type": "ai"})
        elif ttr > 0.80 and score < 50:
            score -= 8
            signals.append({"label": "Vocabulário rico e diversificado", "type": "human"})

    # ── 10. Human Informal & First-Person Markers
    human_pt = r'\b(eu\b|meu\b|minha\b|a gente\b|cara\b|mano\b|né\b|kkk+|haha+|pra mim|tava\b|tô\b|achei\b|gostei\b|fui\b|comprei\b|vi\b)'
    human_en = r'\b(i\b|my\b|me\b|we\b|our\b|lol|haha|tbh|imo|honestly|kinda|gonna|wanna|dude|bro)'
    human_pat = human_pt if language == "pt" else (human_en if language == "en" else f"({human_pt}|{human_en})")
    human_matches = len(re.findall(human_pat, lower))
    if human_matches >= 2:
        score -= 25
        signals.append({"label": "Uso evidente de primeira pessoa e marcadores coloquiais", "type": "human"})
    elif human_matches == 1 and score < 60:
        score -= 12
        signals.append({"label": "Presença de tom pessoal e conversacional", "type": "human"})

    # If no AI tropes matched at all and score is still low, confirm natural human writing
    if score <= 30 and not any(s['type'] == 'ai' for s in signals):
        signals.append({"label": "Ausência de padrões e fórmulas sintéticas de LLM", "type": "human"})

    # Clamp score to realistic bounds
    score = max(4.0, min(98.5, score))
    return score, signals


# ─── TEXT DETECTION ────────────────────────────────────────────────────────────

@app.post("/detect/text")
def detect_text(req: TextRequest):
    text = req.text.strip()
    if len(text) < 20:
        raise HTTPException(status_code=400, detail="Texto muito curto. Mínimo de 20 caracteres.")

    language = _detect_language(text)
    score, signals = _analyze_text(text, language)

    verdict = "IA" if score > 50 else "HUMANO"
    confidence = score if verdict == "IA" else (100 - score)

    return {
        "verdict": verdict,
        "ai_score": round(score, 1),
        "human_score": round(100 - score, 1),
        "confidence": round(confidence, 1),
        "signals": signals,
        "language": language,
    }


# ─── DOCUMENT DETECTION ────────────────────────────────────────────────────────

@app.post("/detect/document")
async def detect_document(file: UploadFile = File(...)):
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()

    if ext not in (".pdf", ".docx"):
        raise HTTPException(
            status_code=400,
            detail="Formato não suportado. Envie um arquivo .pdf ou .docx."
        )

    try:
        contents = await file.read()

        if ext == ".pdf":
            text = _extract_pdf_text(contents)
        else:
            text = _extract_docx_text(contents)

        text = text.strip()
        extracted_chars = len(text)

        if extracted_chars < 20:
            raise HTTPException(
                status_code=422,
                detail="Texto extraído muito curto ou arquivo vazio."
            )

        language = _detect_language(text)
        score, signals = _analyze_text(text, language)
        verdict = "IA" if score > 50 else "HUMANO"
        confidence = score if verdict == "IA" else (100 - score)

        return {
            "verdict": verdict,
            "ai_score": round(score, 1),
            "human_score": round(100 - score, 1),
            "confidence": round(confidence, 1),
            "signals": signals,
            "language": language,
            "extracted_chars": extracted_chars,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar documento: {str(e)}")


def _extract_pdf_text(data: bytes) -> str:
    """Extract all text from a PDF bytes blob using pdfplumber."""
    import pdfplumber
    import io

    text_parts = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def _extract_docx_text(data: bytes) -> str:
    """Extract all text from a DOCX bytes blob using python-docx."""
    from docx import Document
    import io

    doc = Document(io.BytesIO(data))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs)


# ─── AUDIO DETECTION ───────────────────────────────────────────────────────────

@app.post("/detect/audio")
async def detect_audio(file: UploadFile = File(...)):
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()

    allowed_exts = {".mp3", ".wav", ".ogg", ".m4a"}
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail="Formato não suportado. Envie um arquivo .mp3, .wav, .ogg ou .m4a."
        )

    try:
        contents = await file.read()
        score, signals = _analyze_audio(contents, filename, ext)
        verdict = "IA" if score > 50 else "HUMANO"
        confidence = score if verdict == "IA" else (100 - score)

        return {
            "verdict": verdict,
            "ai_score": round(score, 1),
            "human_score": round(100 - score, 1),
            "confidence": round(confidence, 1),
            "signals": signals,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar áudio: {str(e)}")


def _analyze_audio(data: bytes, filename: str, ext: str):
    """Heuristic-only audio AI detection. Returns (score 0-100, signals)."""
    signals = []
    score = 0.0

    file_size = len(data)
    fname_lower = filename.lower()

    # ── 1. Filename TTS pattern detection
    tts_patterns = [
        "tts_", "tts-", "elevenlabs", "eleven_labs", "synth_", "synth-",
        "generated", "ai_voice", "ai-voice", "voiceover_ai", "murf_",
        "replica_", "resemble_", "speechify", "naturalreader", "text2speech",
        "text_to_speech", "fakeyou",
    ]
    matched_patterns = [p for p in tts_patterns if p in fname_lower]
    if matched_patterns:
        score += 35
        signals.append({
            "label": f"Nome do arquivo sugere TTS ({', '.join(matched_patterns)})",
            "type": "ai"
        })
    else:
        signals.append({"label": "Nome do arquivo sem padrões TTS conhecidos", "type": "human"})

    # ── 2. File-size-based bitrate uniformity heuristic
    # Estimate approximate duration from file size and typical bitrates.
    # TTS engines tend to produce files with extremely consistent bitrate (CBR).
    # We approximate: for CBR audio, file_size / expected_bitrate_bytes ≈ duration.
    # We flag files that are suspiciously small for their extension (over-compressed),
    # or whose size falls exactly on round CBR byte boundaries (multiples of 8000, 16000, 44100 * 2).

    if ext == ".wav":
        # WAV files are uncompressed; check for suspiciously round sample counts.
        # Standard TTS WAV: 22050 or 16000 Hz, 16-bit mono → 32000 or 44100 bytes/s
        for std_rate in (16000 * 2, 22050 * 2, 44100 * 2):
            if file_size > std_rate and file_size % std_rate < 100:
                score += 20
                signals.append({
                    "label": "Tamanho WAV exatamente alinhado a taxa padrão de TTS",
                    "type": "ai"
                })
                break
        else:
            signals.append({"label": "Tamanho de arquivo WAV irregular (padrão humano)", "type": "human"})

    elif ext == ".mp3":
        # TTS MP3s are almost always 128 kbps CBR = 16000 bytes/s
        # Check if size is a near-perfect multiple of 16000 (within 1 %)
        expected_rate = 16000  # bytes per second at 128 kbps
        if file_size > expected_rate:
            remainder = file_size % expected_rate
            ratio = remainder / file_size
            if ratio < 0.01:
                score += 18
                signals.append({
                    "label": "MP3 com tamanho perfeitamente uniforme (CBR de TTS)",
                    "type": "ai"
                })
            else:
                signals.append({"label": "Variação de bitrate detectada (VBR — mais humano)", "type": "human"})

    elif ext in (".ogg", ".m4a"):
        # Heuristic: TTS ogg/m4a are usually very small relative to quality
        # Flag files under 500 KB that have very round sizes (multiples of 4096)
        if file_size < 500_000 and file_size % 4096 < 50:
            score += 15
            signals.append({"label": "Arquivo comprimido com alinhamento de bloco suspeito", "type": "ai"})
        else:
            signals.append({"label": "Tamanho de arquivo sem padrão de alinhamento TTS", "type": "human"})

    # ── 3. File size sanity check (very tiny files for audio duration are suspicious)
    # Files under 10 KB are almost certainly short TTS clips or test tones
    if file_size < 10_000:
        score += 10
        signals.append({"label": "Arquivo muito pequeno para áudio natural", "type": "ai"})
    elif file_size > 5_000_000:
        # Large files are more likely to be real recordings
        score -= 10
        signals.append({"label": "Arquivo grande — mais compatível com gravação real", "type": "human"})

    # ── 4. WAV header analysis (deep check only for WAV)
    if ext == ".wav" and len(data) >= 44:
        # WAV header bytes 22-23 = num channels, 24-27 = sample rate, 34-35 = bit depth
        try:
            import struct
            num_channels = struct.unpack_from("<H", data, 22)[0]
            sample_rate = struct.unpack_from("<I", data, 24)[0]
            bit_depth = struct.unpack_from("<H", data, 34)[0]

            tts_configs = [
                (1, 16000, 16),
                (1, 22050, 16),
                (1, 24000, 16),
                (1, 44100, 16),
            ]
            if (num_channels, sample_rate, bit_depth) in tts_configs:
                score += 15
                signals.append({
                    "label": f"Configuração WAV típica de TTS ({sample_rate} Hz, {num_channels}ch, {bit_depth}bit)",
                    "type": "ai"
                })
            else:
                signals.append({
                    "label": f"Configuração WAV não-padrão de TTS ({sample_rate} Hz, {num_channels}ch, {bit_depth}bit)",
                    "type": "human"
                })
        except Exception:
            pass  # If header parse fails, skip this signal

    # ── Clamp
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
