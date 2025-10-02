import type { AdapterOptions } from "./types.js";
import type { CaptchaAdapter } from "adminforth";

declare global {
  interface Window {
    turnstile: {
      render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => void;
    };
  }
}


export default class CaptchaAdapterCloudflare implements CaptchaAdapter {
  options: AdapterOptions;
  private token: string;

  constructor(options: AdapterOptions) {
    this.options = options;
  }

  getScriptSrc(): string {
    return `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`;
  }

  getSiteKey(): string {
    return this.options.siteKey;
  }

  getWidgetId(): string {
    return 'turnstile-container';
  }

  getToken(): Promise<string> {
    return Promise.resolve(this.token);
  }

  renderWidget(): void {
    const el = document.getElementById("turnstile-container");

    if (!el) {
      throw new Error("Turnstile container not found");
    }

    window.turnstile.render(el, {
      sitekey: this.options.siteKey,
      callback: (token) => {
        this.token = token;
      },
    });
  }

  async validate(token: string, ip: string): Promise<Record<string, any>> {
    const formData = new FormData();
    formData.append('secret', this.options.secretKey);
    formData.append('response', token);
    formData.append('remoteip', ip);
    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Turnstile validation error:', error);
        return { success: false, 'error-codes': ['internal-error'] };
    }
  }
 
}