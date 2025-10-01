import type { AdapterOptions } from "./types.js";
import type { CaptchaAdapter } from "adminforth";


export default class CaptchaAdapterCloudflare implements CaptchaAdapter {
  options: AdapterOptions;

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

  getToken(): Promise<string> | string { 
    if (!(window as any).turnstile) {
        throw new Error('Turnstile script not loaded');
    }
    return (window as any).turnstile.getResponse("turnstile-container");
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