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

  getRenderWidgetCode(): string {
    return `
      window.renderCaptchaWidgetCloudflare = function(containerId, siteKey, onSuccess) {
        if (!window.turnstile) {
          console.error('Turnstile script is not loaded');
          return;
        }
        return window.turnstile.render('#' + containerId, {
          sitekey: siteKey,
          callback: function(token) {
            if (typeof onSuccess === 'function') {
              onSuccess(token);
            }
          }
        });
      };
    `;
  }

  getRenderWidgetFunctionName(): string {
    return 'renderCaptchaWidgetCloudflare';
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