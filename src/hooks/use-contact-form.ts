import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ContactFormState = {
  name: string;
  phone: string;
  email: string;
  age: string;
  message: string;
  // Honeypot: скрытое поле только для ботов, пользователю не показывается
  company_website: string;
};

export type ContactFieldErrors = Partial<Record<keyof ContactFormState, string>>;

export type ContactFormStatus = "idle" | "submitting" | "success" | "error";

const EMPTY: ContactFormState = {
  name: "",
  phone: "",
  email: "",
  age: "",
  message: "",
  company_website: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Маска телефона: +7 (XXX) XXX-XX-XX, 8 и 7 нормализуются */
export function formatPhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (!d.startsWith("7")) d = "7" + d;
  d = d.slice(0, 11);
  const p = d.slice(1);
  let out = "+7";
  if (p.length > 0) out += " (" + p.slice(0, 3);
  if (p.length >= 3) out += ")";
  if (p.length > 3) out += " " + p.slice(3, 6);
  if (p.length > 6) out += "-" + p.slice(6, 8);
  if (p.length > 8) out += "-" + p.slice(8, 10);
  return out;
}

/** Валидация одного поля (для onBlur) */
export function validateContactField(
  field: keyof ContactFormState,
  value: string
): string | undefined {
  const v = value.trim();
  if (field === "name" && v.length > 0 && v.length < 2) return "Введите имя";
  if (field === "phone") {
    if (v.length > 0 && v.replace(/\D/g, "").length < 10) return "Введите корректный телефон";
  }
  if (field === "email" && v.length > 0 && !EMAIL_RE.test(v)) return "Введите корректный email";
  return undefined;
}

function validateAll(form: ContactFormState): ContactFieldErrors {
  const errors: ContactFieldErrors = {};
  if (form.name.trim().length < 2) errors.name = "Имя обязательно";
  if (form.phone.replace(/\D/g, "").length < 10) errors.phone = "Введите корректный телефон";
  if (form.email && !EMAIL_RE.test(form.email)) errors.email = "Введите корректный email";
  return errors;
}

export function useContactForm() {
  const [formData, setFormData] = useState<ContactFormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<ContactFormStatus>("idle");
  const summaryRef = useRef<HTMLDivElement | null>(null);

  const setField = (field: keyof ContactFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Ошибка снимается при исправлении поля
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (status === "error") setStatus("idle");
  };

  const handlePhoneInput = (value: string) => {
    setField("phone", formatPhone(value));
  };

  const handleBlur = (field: keyof ContactFormState) => {
    const err = validateContactField(field, formData[field]);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
  };

  const submit = async (): Promise<boolean> => {
    const errors = validateAll(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Проверьте выделенные поля и попробуйте ещё раз");
      requestAnimationFrame(() => summaryRef.current?.focus());
      return false;
    }

    setStatus("submitting");
    setFormError(null);
    try {
      const { error } = await supabase.functions.invoke("contact-request", {
        body: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          child_age: formData.age,
          message: formData.message,
          company_website: formData.company_website,
        },
      });
      if (error) throw new Error(error.message);
      setStatus("success");
      return true;
    } catch (e: unknown) {
      setStatus("error");
      setFormError((e as Error).message || "Не удалось отправить заявку. Попробуйте позже.");
      requestAnimationFrame(() => summaryRef.current?.focus());
      return false;
    }
  };

  const reset = () => {
    setFormData(EMPTY);
    setFieldErrors({});
    setFormError(null);
    setStatus("idle");
  };

  return {
    formData,
    setField,
    handlePhoneInput,
    handleBlur,
    fieldErrors,
    formError,
    status,
    submit,
    reset,
    summaryRef,
  };
}
