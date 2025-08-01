import sys
import os
import torch
import torchaudio

# 🧠 Détection automatique de l'appareil (GPU si dispo, sinon CPU)
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🖥️ Utilisation du device : {DEVICE}")

# 📦 Import des fonctions principales de Tortoise TTS
from tortoise.api import TextToSpeech
from tortoise.utils.audio import load_voice

# 🛠️ Fonction principale pour générer de la voix à partir d'un texte
def generate(
    text,
    output_path=os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "temp", "tts_output.wav")
    )
):
    # 🧠 Initialisation du moteur TTS avec le bon device
    tts = TextToSpeech(device=DEVICE)

    # 📥 Définition du chemin vers le dossier contenant les voix personnalisées
    voice_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "voices"))
    print(f"📁 Dossier voix personnalisé : {voice_dir}")

    # ✅ Vérification que le dossier de voix existe bien
    if not os.path.exists(os.path.join(voice_dir, "bai_hu")):
        print("❌ Le dossier 'bai_hu' n'existe pas dans 'voices'.")
        sys.exit(1)

    # 📥 Chargement de la voix personnalisée
    voice_samples, conditioning_latents = load_voice("bai_hu", extra_voice_dirs=[voice_dir])
    print(f"🔍 Nombre d'échantillons de voix chargés : {len(voice_samples)}")

    # 🗣️ Génération de l'audio avec le preset haute qualité
    gen = tts.tts_with_preset(
        text=text,
        voice_samples=voice_samples,
        conditioning_latents=conditioning_latents,
        preset="high_quality"
    )

    # 💾 Déplacement sur CPU si nécessaire pour la sauvegarde
    if gen.device.type != "cpu":
        gen = gen.cpu()

    # 🔁 Mise en forme du tenseur pour torchaudio
    if gen.ndim == 4:
        gen = gen.squeeze(0).squeeze(0)  # (1, 1, N) → (N,)
    elif gen.ndim == 3:
        gen = gen.squeeze(0)             # (1, C, N) → (C, N)
    if gen.ndim == 1:
        gen = gen.unsqueeze(0)           # (N,) → (1, N)

    # 💾 Sauvegarde de l'audio
    torchaudio.save(output_path, gen, sample_rate=24000)

    # ✅ Chemin final du fichier généré
    return output_path

# 📌 Point d'entrée du script si exécuté directement
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❗ Veuillez fournir un texte à synthétiser.")
        sys.exit(1)

    texte = sys.argv[1]
    output = generate(texte)
    print(f"✅ Fichier généré : {output}")