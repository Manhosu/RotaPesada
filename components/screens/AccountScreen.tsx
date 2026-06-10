"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Mail, Lock, Check, CircleCheck, TriangleAlert, UserCheck } from "lucide-react";
import { StatusBar } from "@/components/app/StatusBar";
import { Alert, Button, IconButton, Input } from "@/components/ui";
import { getAccountStatus, promoteAccount, signOut, type AccountStatus } from "@/lib/account";
import type { ScreenProps } from "@/lib/navigation";

type Feedback = { kind: "ok" | "error"; message: string } | null;

/**
 * Conta — promove a sessão anônima para conta permanente (e-mail + senha),
 * preservando os dados. Login por telefone exige provedor de SMS (futuro).
 */
export function AccountScreen({ go }: ScreenProps) {
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    getAccountStatus().then(setStatus);
  }, []);

  async function handleSubmit(e: FormEvent) {
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
      getAccountStatus().then(setStatus);
    } else {
      setFeedback({ kind: "error", message: res.error });
    }
  }

  const jaTemConta = status && !status.isAnonymous && status.email;

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
                Você está conectado como <strong>{status?.email}</strong>. Seus veículos e
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
            <form className="vform__form" onSubmit={handleSubmit} noValidate>
              <p className="vform__sub">
                Você está usando uma sessão anônima. Crie uma conta para não perder seus dados e
                acessar de outro aparelho.
              </p>

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

              {feedback ? (
                <Alert
                  variant={feedback.kind === "ok" ? "clear" : "restriction"}
                  title={feedback.kind === "ok" ? "Pronto" : "Não foi possível"}
                  icon={feedback.kind === "ok" ? <CircleCheck /> : <TriangleAlert />}
                >
                  {feedback.message}
                </Alert>
              ) : null}

              <Button type="submit" variant="primary" size="xl" block icon={<Check />} disabled={saving}>
                {saving ? "Salvando…" : "Criar minha conta"}
              </Button>

              <p className="vform__sub" style={{ marginTop: 0 }}>
                Login por telefone (SMS) chega quando um provedor for configurado.
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
