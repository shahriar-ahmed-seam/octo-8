# ─────────────────────────────────────────────────────────────
# Ollama service for OCTO-8's AI assistant.
#
# Runs an Ollama server and pre-pulls the default model on first boot.
# Deploy on Render (see ../../render.yaml) or any Docker host, then set
# OLLAMA_URL on the Vercel project to this service's URL.
#
# NOTE: a 4B model needs a plan with enough RAM (roughly 6GB+). The
# assistant is optional — the app runs fully without it.
# ─────────────────────────────────────────────────────────────
FROM ollama/ollama:latest

# Allow the browser (via the Vercel proxy) to call this instance.
ENV OLLAMA_HOST=0.0.0.0:11434
ENV OLLAMA_ORIGINS=*
ENV OLLAMA_MODEL=gemma3:4b

COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 11434
ENTRYPOINT ["/start.sh"]
