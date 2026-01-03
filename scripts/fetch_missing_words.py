#!/usr/bin/env python3
"""
批量获取缺失词汇的音标和释义
使用 Free Dictionary API

运行方式:
  python3 scripts/fetch_missing_words.py

注意: 由于 API 限制，完整运行可能需要 10-20 分钟
"""
import subprocess
import json
import time
import os
import sys

BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src/data/words')
PROGRESS_FILE = '/tmp/word_fetch_progress.json'


def get_word_info(word):
    """从 Free Dictionary API 获取词汇信息"""
    try:
        result = subprocess.run(
            ['curl', '-s', '--max-time', '5',
             f'https://api.dictionaryapi.dev/api/v2/entries/en/{word}'],
            capture_output=True, text=True
        )
        if result.returncode == 0 and result.stdout:
            try:
                data = json.loads(result.stdout)
                if isinstance(data, list) and len(data) > 0:
                    entry = data[0]

                    # 获取音标
                    phonetic = ''
                    for p in entry.get('phonetics', []):
                        if p.get('text'):
                            phonetic = p['text']
                            break

                    # 获取释义
                    meaning_en = ''
                    for m in entry.get('meanings', []):
                        for d in m.get('definitions', []):
                            meaning_en = d.get('definition', '')
                            if len(meaning_en) > 60:
                                meaning_en = meaning_en[:57] + '...'
                            break
                        if meaning_en:
                            break

                    if phonetic or meaning_en:
                        return {'phonetic': phonetic, 'meaning_en': meaning_en}
            except json.JSONDecodeError:
                pass
    except Exception:
        pass
    return None


def find_missing_words():
    """查找缺少音标或释义的词汇"""
    missing = set()
    for subdir in ['cefr', 'china']:
        dir_path = os.path.join(BASE_PATH, subdir)
        for filename in os.listdir(dir_path):
            if not filename.endswith('.json'):
                continue
            filepath = os.path.join(dir_path, filename)
            with open(filepath, 'r') as f:
                data = json.load(f)
            for w in data['words']:
                if not w.get('phonetic') or not w.get('meaning', {}).get('en'):
                    missing.add(w['word'].lower())
    return sorted(missing)


def load_progress():
    """加载进度"""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f).get('processed', {})
    return {}


def save_progress(processed):
    """保存进度"""
    with open(PROGRESS_FILE, 'w') as f:
        json.dump({'processed': processed}, f, ensure_ascii=False)


def update_word_files(processed):
    """更新词库文件"""
    for subdir in ['cefr', 'china']:
        dir_path = os.path.join(BASE_PATH, subdir)
        for filename in os.listdir(dir_path):
            if not filename.endswith('.json'):
                continue
            filepath = os.path.join(dir_path, filename)
            with open(filepath, 'r') as f:
                data = json.load(f)

            for w in data['words']:
                word = w['word'].lower()
                if word in processed and processed[word]:
                    info = processed[word]
                    if not w.get('phonetic') and info.get('phonetic'):
                        w['phonetic'] = info['phonetic']
                    if not w.get('meaning', {}).get('en') and info.get('meaning_en'):
                        if 'meaning' not in w:
                            w['meaning'] = {'zh': '', 'en': ''}
                        w['meaning']['en'] = info['meaning_en']

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    print("=" * 50)
    print("词汇信息补充工具")
    print("=" * 50)

    # 查找缺失的词汇
    missing_words = find_missing_words()
    print(f"\n缺少信息的词汇: {len(missing_words)} 个")

    # 加载已处理的进度
    processed = load_progress()
    print(f"已处理: {len(processed)} 个")

    # 筛选未处理的词
    remaining = [w for w in missing_words if w not in processed]
    print(f"待处理: {len(remaining)} 个")

    if not remaining:
        print("\n所有词汇已处理完成!")
        return

    print(f"\n开始处理... (预计需要 {len(remaining) * 0.15 / 60:.1f} 分钟)")
    print("按 Ctrl+C 可中断，下次运行会继续\n")

    try:
        count = 0
        for i, word in enumerate(remaining):
            info = get_word_info(word)
            if info:
                processed[word] = info
                count += 1
            else:
                processed[word] = {}

            time.sleep(0.1)

            # 每 100 个词保存一次进度
            if (i + 1) % 100 == 0:
                save_progress(processed)
                update_word_files(processed)
                print(f"  进度: {i+1}/{len(remaining)}, 成功获取: {count}")

    except KeyboardInterrupt:
        print("\n\n中断! 保存进度...")

    # 最终保存
    save_progress(processed)
    update_word_files(processed)

    success = sum(1 for v in processed.values() if v)
    print(f"\n完成! 成功获取: {success} 个词的信息")
    print("词库文件已更新")


if __name__ == '__main__':
    main()
