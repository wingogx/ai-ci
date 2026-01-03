#!/usr/bin/env python3
"""
增强版词汇信息获取工具
使用多个数据源: Free Dictionary API, Datamuse API, Wordnet
"""
import subprocess
import json
import time
import os
import re

BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src/data/words')
PROGRESS_FILE = '/tmp/word_fetch_enhanced.json'


def get_from_free_dict(word):
    """从 Free Dictionary API 获取"""
    try:
        result = subprocess.run(
            ['curl', '-s', '--max-time', '5',
             f'https://api.dictionaryapi.dev/api/v2/entries/en/{word}'],
            capture_output=True, text=True
        )
        if result.returncode == 0 and result.stdout:
            data = json.loads(result.stdout)
            if isinstance(data, list) and len(data) > 0:
                entry = data[0]
                phonetic = ''
                for p in entry.get('phonetics', []):
                    if p.get('text'):
                        phonetic = p['text']
                        break
                meaning_en = ''
                for m in entry.get('meanings', []):
                    for d in m.get('definitions', []):
                        meaning_en = d.get('definition', '')
                        if len(meaning_en) > 60:
                            meaning_en = meaning_en[:57] + '...'
                        break
                    if meaning_en:
                        break
                return {'phonetic': phonetic, 'meaning_en': meaning_en}
    except:
        pass
    return None


def get_from_datamuse(word):
    """从 Datamuse API 获取释义"""
    try:
        # 获取定义
        result = subprocess.run(
            ['curl', '-s', '--max-time', '5',
             f'https://api.datamuse.com/words?sp={word}&md=d&max=1'],
            capture_output=True, text=True
        )
        if result.returncode == 0 and result.stdout:
            data = json.loads(result.stdout)
            if data and len(data) > 0 and 'defs' in data[0]:
                defs = data[0]['defs']
                if defs:
                    # 格式: "n\tdefinition" 或 "v\tdefinition"
                    meaning = defs[0].split('\t')[-1] if '\t' in defs[0] else defs[0]
                    if len(meaning) > 60:
                        meaning = meaning[:57] + '...'
                    return {'meaning_en': meaning}
    except:
        pass
    return None


def generate_phonetic(word):
    """为简单词生成近似音标"""
    # 只处理纯字母单词
    if not word.isalpha() or len(word) > 10:
        return None

    # 常见发音规则映射
    phonetic_map = {
        'a': 'æ', 'e': 'e', 'i': 'ɪ', 'o': 'ɒ', 'u': 'ʌ',
        'ai': 'eɪ', 'ay': 'eɪ', 'ea': 'iː', 'ee': 'iː',
        'oo': 'uː', 'ou': 'aʊ', 'ow': 'aʊ', 'oi': 'ɔɪ',
        'oy': 'ɔɪ', 'ar': 'ɑː', 'er': 'ɜː', 'ir': 'ɜː',
        'or': 'ɔː', 'ur': 'ɜː', 'th': 'θ', 'sh': 'ʃ',
        'ch': 'tʃ', 'ng': 'ŋ', 'ph': 'f', 'wh': 'w',
    }

    # 简单单词直接返回 None，不生成
    return None


def find_missing_words():
    """查找缺少音标或释义的词汇，返回详细信息"""
    missing = []
    for subdir in ['cefr', 'china']:
        dir_path = os.path.join(BASE_PATH, subdir)
        for filename in os.listdir(dir_path):
            if not filename.endswith('.json'):
                continue
            filepath = os.path.join(dir_path, filename)
            with open(filepath, 'r') as f:
                data = json.load(f)
            for w in data['words']:
                needs_phonetic = not w.get('phonetic')
                needs_meaning = not w.get('meaning', {}).get('en')
                if needs_phonetic or needs_meaning:
                    missing.append({
                        'word': w['word'].lower(),
                        'needs_phonetic': needs_phonetic,
                        'needs_meaning': needs_meaning,
                        'file': f'{subdir}/{filename}'
                    })
    return missing


def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f).get('processed', {})
    return {}


def save_progress(processed):
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

            modified = False
            for w in data['words']:
                word = w['word'].lower()
                if word in processed and processed[word]:
                    info = processed[word]
                    if not w.get('phonetic') and info.get('phonetic'):
                        w['phonetic'] = info['phonetic']
                        modified = True
                    if not w.get('meaning', {}).get('en') and info.get('meaning_en'):
                        if 'meaning' not in w:
                            w['meaning'] = {'zh': '', 'en': ''}
                        w['meaning']['en'] = info['meaning_en']
                        modified = True

            if modified:
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    print("=" * 50)
    print("增强版词汇信息补充工具")
    print("=" * 50)

    missing_words = find_missing_words()
    print(f"\n缺少信息的词汇: {len(missing_words)} 个")

    processed = load_progress()
    print(f"已处理: {len(processed)} 个")

    # 筛选未处理的
    remaining = [w for w in missing_words if w['word'] not in processed]
    print(f"待处理: {len(remaining)} 个")

    if not remaining:
        print("\n所有词汇已处理!")
        return

    print(f"\n开始处理...")
    print("数据源: Free Dictionary API + Datamuse API")
    print("按 Ctrl+C 可中断\n")

    success_count = 0
    try:
        for i, item in enumerate(remaining):
            word = item['word']
            info = {}

            # 尝试 Free Dictionary API
            result = get_from_free_dict(word)
            if result:
                info.update(result)

            # 如果还缺释义，尝试 Datamuse
            if item['needs_meaning'] and not info.get('meaning_en'):
                result = get_from_datamuse(word)
                if result:
                    info.update(result)

            if info:
                processed[word] = info
                success_count += 1
            else:
                processed[word] = {}  # 标记为已尝试

            time.sleep(0.15)  # 避免请求过快

            if (i + 1) % 50 == 0:
                save_progress(processed)
                update_word_files(processed)
                print(f"  进度: {i+1}/{len(remaining)}, 本轮成功: {success_count}")

    except KeyboardInterrupt:
        print("\n\n中断!")

    save_progress(processed)
    update_word_files(processed)
    print(f"\n完成! 本轮成功获取: {success_count} 个")


if __name__ == '__main__':
    main()
