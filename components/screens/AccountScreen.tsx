"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Mail, Lock, Phone, Check, CircleCheck, TriangleAlert, UserCheck } from "lucide-react";
import { StatusBar } from "@/components/app/StatusBar";
import { Alert, Button, IconButton, Input, SegmentedControl } from "@/components/ui";
import {
  getAccountStatus,
  promoteAccount,
  enviarCodigoTelefone,
  confirmarCodigoTelefone,
  signOut,
  type AccountStatus,
} from "@/lib/account";
import type { ScreenProps } from "@/lib/navigation";

type Feedback = { kind: "ok" | "error"; message: string } | null;

/**
 * Conta — promove a sessão anônima para conta permanente por e-mail/senha ou
 * por telefone (SMS). O telefone requer um provedor de SMS configurado no
 * Supabase; sem ele, o envio retorna um aviso claro.
 */
export function AccountScreen({ go }: ScreenProps) {
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [metodo, setMetodo] = useState("email");

  // e-mail
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  // telefone
  const [phone, setPhone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const refresh = () => getAccountStatus().then(setStatus);
  useEffect(() => {
    refresh();
  }, []);

  async function submitEmail(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    const res = await promoteAccount(email, senha);
    setSaving(false);
    if (res.ok) {
      setFeedback({
        kind: "ok",
        message: res.confirmEmail
          ? "Conta criada. Confira seu e-mail para confirmar o endereço."
          : "Conta salva com sucesso.",
      });
      refresh();
    } else {
      setFeedback({ kind: "error", message: res.error });
    }
  }

  async function submitPhone(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    if (!codeSent) {
      const res = await enviarCodigoTelefone(phone);
      setSaving(false);
      if (res.ok) {
        setCodeSent(true);
        setFeedback({ kind: "ok", message: "Código enviado por SMS. Digite-o abaixo." });
      } else {
        setFeedback({ kind: "error", message: res.error });
      }
      return;
    }
    const res = await confirmarCodigoTelefone(phone, codigo);
    setSaving(false);
    if (res.ok) {
      setFeedback({ kind: "ok", message: "Telefone confirmado. Conta salva." });
      setCodeSent(false);
      refresh();
    } else {
      setFeedback({ kind: "error", message: res.error });
    }
  }

  const jaTemConta = status && !status.isAnonymous && (status.email || status.phone);

  return (
    <>
      <StatusBar />
      <div className="scr" style={{ background: "var(--surface-app)" }}>
        <div className="vform">
          <div className="backrow">
            <IconButton variant="secondary" size="md" label="Voltar" icon={<ArrowLeft />} onClick={() => go("home")} />
            <h1 className="vform__title">Minha conta</h1>
          </div>

          {jaTemConta ? (
            <>
              <Alert variant="clear" title="Conta ativa" icon={<UserCheck />}>
                Conectado como <strong>{status?.email ?? status?.phone}</strong>. Seus veículos e
                reports ficam salvos.
              </Alert>
              <Button
                variant="ghost"
                size="lg"
                block
                onClick={async () => {
                  await signOut();
                  go("home");
                }}
              >
                Sair desta conta
              </Button>
            </>
          ) : (
            <>
              <p className="vform__sub">
                Você está usando uma sessão anônima. Crie uma conta para não perder seus dados e
                acessar de outro aparelho.
              </p>

              <SegmentedControl
                block
                value={metodo}
                onChange={(v) => {
                  setMetodo(v);
                  setFeedback(null);
                  setCodeSent(false);
                }}
                options={[
                  { value: "email", label: "E-mail" },
                  { value: "telefone", label: "Telefone" },
                ]}
              />

              {feedback ? (
                <Alert
                  variant={feedback.kind === "ok" ? "clear" : "restriction"}
                  title={feedback.kind === "ok" ? "Pronto" : "Não foi possível"}
                  icon={feedback.kind === "ok" ? <CircleCheck /> : <TriangleAlert />}
                >
                  {feedback.message}
                </Alert>
              ) : null}

              {metodo === "email" ? (
                <form className="vform__form" onSubmit={submitEmail} noValidate>
                  <Input
                    label="E-mail"
                    icon={<Mail />}
                    type="email"
                    inputMode="email"
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                  <Input
                    label="Senha"
                    icon={<Lock />}
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="new-password"
                  />
                  <Button type="submit" variant="primary" size="xl" block icon={<Check />} disabled={saving}>
                    {saving ? "Salvando…" : "Criar minha conta"}
                  </Button>
                </form>
              ) : (
                <form className="vform__form" onSubmit={submitPhone} noValidate>
                  <Input
                    label="Telefone"
                    icon={<Phone />}
                    type="tel"
                    inputMode="tel"
                    placeholder="+5513912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    disabled={codeSent}
                  />
                  {codeSent ? (
                    <Input
                      label="Código SMS"
                      icon={<Lock />}
                      inputMode="numeric"
                      placeholder="000000"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value)}
                    />
                  ) : null}
                  <Button type="submit" variant="primary" size="xl" block icon={<Check />} disabled={saving}>
                    {saving ? "Enviando…" : codeSent ? "Confirmar código" : "Enviar código SMS"}
                  </Button>
                  <p className="vform__sub" style={{ marginTop: 0 }}>
                    Requer provedor de SMS configurado no Supabase.
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
