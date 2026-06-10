/**
 * Voice-First Engine — alertas falados (Web Speech API).
 *
 * Voz é o canal primário de alerta: o motorista não deve tirar os olhos da
 * pista. Mensagens curtas, imperativas, em pt-BR. Falha de forma graciosa
 * onde `speechSynthesis` não existe (SSR ou navegador sem suporte).
 *
 * Observação: alguns navegadores bloqueiam o áudio até o primeiro gesto do
 * usuário. Não tratamos como erro — apenas não soa até haver interação.
 */

export function isSpeechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Fala um texto em pt-BR, cancelando qualquer fala anterior. */
export function speak(text: string): void {
  if (!isSpeechAvailable()) return;
  try {
    const synth = window.speechSynthesis;
    // Interrompe fala em andamento para o alerta mais recente ter prioridade.
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "pt-BR";
    utter.rate = 1; // ritmo natural
    utter.pitch = 1;
    utter.volume = 1;
    synth.speak(utter);
  } catch (err) {
    // Nunca deixar a voz quebrar o loop de navegação.
    console.warn("speechSynthesis indisponível:", err);
  }
}

/** Cancela qualquer fala em andamento (ex.: ao desmontar a navegação). */
export function cancelSpeech(): void {
  if (!isSpeechAvailable()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* no-op */
  }
}
