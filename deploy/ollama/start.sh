#!/bin/sh
# Boot Ollama, pull the model once it's up, then keep the server in foreground.
set -e

ollama serve &
SERVER_PID=$!

# Wait for the server to accept connections.
echo "Waiting for Ollama to start..."
until ollama list >/dev/null 2>&1; do
  sleep 1
done

echo "Pulling model: ${OLLAMA_MODEL:-gemma3:4b}"
ollama pull "${OLLAMA_MODEL:-gemma3:4b}" || echo "Model pull failed; will retry on first request."

wait "$SERVER_PID"
