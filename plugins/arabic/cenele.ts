import { fetchText } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { load as loadCheerio } from 'cheerio';
import { defaultCover } from '@libs/defaultCover';

class CenelePlugin implements Plugin.PluginBase {
  id = 'cenele';
  name = 'فضاء الروايات';
  icon = 'src/ar/cenele/icon.png';
  site = 'https://cenele.com';
  version = '1.0.0';

  async popularNovels(
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const novels: Plugin.NovelItem[] = [];

    const url = `${this.site}/novels/page/${pageNo}/`;
    const html = await fetchText(url);
    const $ = loadCheerio(html);

    $('.row.c-tabs-item__content').each((_, el) => {
      const link = $(el).find('.tab-thumb a').attr('href');
      const name = $(el).find('.tab-summary .post-title a').text().trim();
      const cover = $(el).find('.tab-thumb img').attr('src');

      if (link && name) {
        novels.push({
          name,
          path: link,
          cover: cover || defaultCover,
        });
      }
    });

    return novels;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const html = await fetchText(
      novelPath.startsWith('http')
        ? novelPath
        : this.site + novelPath,
    );

    const $ = loadCheerio(html);

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: $('.post-title h1').first().text().trim() || 'بدون اسم',
      cover:
        $('.summary_image img').attr('src') ||
        $('.summary_image img').attr('data-src') ||
        defaultCover,
    };

    novel.author = $('.author-content a').first().text().trim();

    const summary = $('.description-summary').text().trim();
    if (summary) novel.summary = summary;

    const chapters: Plugin.ChapterItem[] = [];

    $('.wp-manga-chapter a').each((_, el) => {
      const href = $(el).attr('href');
      const name = $(el).text().trim();

      if (href && name) {
        const match = name.match(/(\d+(?:\.\d+)?)/);

        chapters.push({
          name,
          path: href,
          releaseTime: '',
          chapterNumber: match ? Number(match[1]) : chapters.length + 1,
        });
      }
    });

    novel.chapters = chapters.reverse();

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const html = await fetchText(
      chapterPath.startsWith('http')
        ? chapterPath
        : this.site + chapterPath,
    );

    const $ = loadCheerio(html);

    const content =
      $('.reading-content').first().html() ||
      $('.text-left').first().html() ||
      $('.entry-content').first().html();

    if (!content) return '';

    return loadCheerio(content).root().text().trim();
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const novels: Plugin.NovelItem[] = [];

    const url =
      `${this.site}/?s=${encodeURIComponent(searchTerm)}` +
      `&post_type=wp-manga&page=${pageNo}`;

    const html = await fetchText(url);
    const $ = loadCheerio(html);

    $('.row.c-tabs-item__content').each((_, el) => {
      const link = $(el).find('.tab-thumb a').attr('href');
      const name = $(el).find('.tab-summary .post-title a').text().trim();
      const cover = $(el).find('.tab-thumb img').attr('src');

      if (link && name) {
        novels.push({
          name,
          path: link,
          cover: cover || defaultCover,
        });
      }
    });

    return novels;
  }

  resolveUrl = (path: string) =>
    path.startsWith('http') ? path : this.site + path;
}

export default new CenelePlugin();
