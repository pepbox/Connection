import fs from 'fs';
import path from 'path';
import { compile } from 'handlebars';

export class EmailTemplateManager {
  private static cache: Map<string, HandlebarsTemplateDelegate> = new Map();

  public static compileTemplate(category: string, templateName: string, variables: any, isHtml: boolean = true): string {
    const cacheKey = `${category}/${templateName}`;
    
    if (!this.cache.has(cacheKey)) {
      const filePath = path.join(__dirname, 'templates', category, `${templateName}.hbs`);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const compiled = compile(fileContent);
      this.cache.set(cacheKey, compiled);
    }

    const template = this.cache.get(cacheKey)!;
    let result = template(variables);

    if (!isHtml) {
      // Convert <br> tags to plain text newlines
      result = result.replace(/<br\s*\/?>/g, '\n');
    }

    return result;
  }
}
