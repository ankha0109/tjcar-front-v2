import Api from "@/services/Api";

/** Both password endpoints answer with a bare message — no `data` envelope. */
type MessageResponse = { message: string };

type ForgotPasswordResponse = MessageResponse & {
  /**
   * The address the link went to, partially masked server-side
   * (`cust***er@example.com`). Optional: an older API build omits it.
   */
  email?: string;
};

/**
 * POST /auth/forgot-password — start a password recovery.
 *
 * The customer is looked up by phone, but the reset link is mailed to the
 * e-mail address on that customer record. A customer registered without an
 * e-mail can therefore never recover, and the backend reports that with the
 * same generic 422 it uses for the 60s resend throttle — the two are
 * indistinguishable from here.
 */
export function forgotPassword(phone: string): Promise<ForgotPasswordResponse> {
  return Api.post<ForgotPasswordResponse>("/auth/forgot-password", { phone });
}

export type ResetPasswordPayload = {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
};

/**
 * POST /auth/reset-password — set a new password using the mailed token.
 *
 * `token` and `email` both come from the link the backend redirected us with.
 * A stale or tampered token comes back as a 422 keyed on `email`, not `token`.
 */
export function resetPassword(
  payload: ResetPasswordPayload,
): Promise<MessageResponse> {
  return Api.post<MessageResponse>("/auth/reset-password", payload);
}
