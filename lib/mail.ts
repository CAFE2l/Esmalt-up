/**
 * Envio de e-mail transacional.
 *
 * Suporta Resend e Mailgun via variáveis de ambiente. Sem provedor
 * configurado (ex.: ambiente local), apenas registra no log — útil para
 * desenvolvimento sem infraestrutura de e-mail.
 */

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
}

const MAIL_FROM =
  process.env.MAIL_FROM ?? "Esmalt'up <contato@esmaltup.com.br>";

export async function sendMail(message: MailMessage): Promise<boolean> {
  try {
    if (process.env.RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: MAIL_FROM,
          to: message.to,
          subject: message.subject,
          html: message.html,
        }),
      });
      return response.ok;
    }

    if (process.env.MAILGUN_DOMAIN && process.env.MAILGUN_API_KEY) {
      const body = new URLSearchParams({
        from: MAIL_FROM,
        to: message.to,
        subject: message.subject,
        html: message.html,
      });
      const response = await fetch(
        `https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`,
        {
          method: "POST",
          headers: {
            authorization: `Basic ${Buffer.from(
              `api:${process.env.MAILGUN_API_KEY}`,
            ).toString("base64")}`,
          },
          body,
        },
      );
      return response.ok;
    }

    if (process.env.NODE_ENV !== "production") {
      console.info(`[mail] (dev) para ${message.to}: ${message.subject}`);
    }
    return true;
  } catch (error) {
    console.error("[mail] falha ao enviar:", error);
    return false;
  }
}

function layout(bodyHtml: string): string {
  return `
    <div style="background:#1a1015;color:#f7f1f3;font-family:Arial,sans-serif;padding:32px 16px">
      <div style="max-width:520px;margin:0 auto;background:#231a1f;border-radius:20px;padding:28px;border:1px solid #3c3036">
        <p style="margin:0 0 16px;font-size:20px;font-weight:bold">
          💅 Esmalt&apos;up
        </p>
        ${bodyHtml}
        <p style="margin:24px 0 0;font-size:12px;color:#a99aa0">
          Esse e-mail foi enviado pela Esmalt'up. Se não foi você, ignore esta mensagem.
        </p>
      </div>
    </div>
  `;
}

export function buildQuestionAnsweredEmail(params: {
  to: string;
  productName: string;
  question: string;
  answer: string;
}): MailMessage {
  return {
    to: params.to,
    subject: `Sua pergunta sobre ${params.productName} foi respondida`,
    html: layout(`
      <p style="color:#e09caa;font-size:13px;letter-spacing:.1em;text-transform:uppercase;margin:0 0 8px">
        Pergunta respondida
      </p>
      <h2 style="margin:0 0 12px;font-size:17px;line-height:1.4">
        Sua pergunta sobre <strong>${params.productName}</strong> foi respondida!
      </h2>
      <p style="margin:0 0 8px;font-size:13px;color:#c4b6bc"><strong>Você perguntou:</strong></p>
      <p style="margin:0 0 16px;font-size:14px;color:#f7f1f3;background:#2d2228;border-radius:12px;padding:12px 14px">
        ${params.question}
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#c4b6bc"><strong>Resposta:</strong></p>
      <p style="margin:0;font-size:14px;color:#e7c8d0;background:#2d2228;border-radius:12px;padding:12px 14px">
        ${params.answer}
      </p>
    `),
  };
}

export function buildOrderConfirmationEmail(params: {
  to: string;
  orderId: string;
  productLabel: string;
  total: string;
}): MailMessage {
  return {
    to: params.to,
    subject: `Pedido ${params.orderId} confirmado — Esmalt'up`,
    html: layout(`
      <p style="color:#e09caa;font-size:13px;letter-spacing:.1em;text-transform:uppercase;margin:0 0 8px">
        Pedido recebido
      </p>
      <h2 style="margin:0 0 12px;font-size:17px">
        Obrigado! Seu pedido <strong>${params.orderId}</strong> foi confirmado.
      </h2>
      <p style="margin:0 0 6px;font-size:14px;color:#c4b6bc">Produto: ${params.productLabel}</p>
      <p style="margin:0;font-size:14px;color:#c4b6bc">Total: <strong style="color:#e09caa">${params.total}</strong></p>
    `),
  };
}