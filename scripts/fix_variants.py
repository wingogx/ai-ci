#!/usr/bin/env python3
"""
处理美式/英式拼写变体和特殊词汇
"""
import subprocess
import json
import time
import os
import re

BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src/data/words')


def get_from_api(word):
    """从 API 获取信息"""
    try:
        resp = subprocess.run(
            ['curl', '-s', '--max-time', '3',
             f'https://api.dictionaryapi.dev/api/v2/entries/en/{word}'],
            capture_output=True, text=True
        )
        if resp.returncode == 0 and resp.stdout and '[' in resp.stdout:
            data = json.loads(resp.stdout)
            if isinstance(data, list) and len(data) > 0:
                entry = data[0]
                phonetic = None
                meaning = None
                for p in entry.get('phonetics', []):
                    if p.get('text'):
                        phonetic = p['text']
                        break
                for m in entry.get('meanings', []):
                    for d in m.get('definitions', []):
                        if d.get('definition'):
                            meaning = d['definition']
                            if len(meaning) > 60:
                                meaning = meaning[:57] + '...'
                            break
                    if meaning:
                        break
                return {'phonetic': phonetic, 'meaning_en': meaning}
    except:
        pass
    return {}


def process_word(word):
    """处理单个词，尝试各种变体"""
    # 如果是美式/英式变体 (word1/word2)
    if '/' in word:
        parts = word.split('/')
        for part in parts:
            info = get_from_api(part.strip())
            if info.get('phonetic') or info.get('meaning_en'):
                return info

    # 如果是复合词
    if ' ' in word:
        # 尝试连字符形式
        info = get_from_api(word.replace(' ', '-'))
        if info.get('phonetic') or info.get('meaning_en'):
            return info
        # 尝试第一个词
        first = word.split()[0]
        info = get_from_api(first)
        if info.get('phonetic') or info.get('meaning_en'):
            return info

    # 直接查询
    return get_from_api(word)


def process_files():
    """处理所有文件"""
    p_fixed = 0
    m_fixed = 0

    for subdir in ['cefr', 'china']:
        dir_path = os.path.join(BASE_PATH, subdir)
        for filename in sorted(os.listdir(dir_path)):
            if not filename.endswith('.json'):
                continue

            filepath = os.path.join(dir_path, filename)
            with open(filepath, 'r') as f:
                data = json.load(f)

            modified = False
            for w in data['words']:
                needs_p = not w.get('phonetic')
                needs_m = not w.get('meaning', {}).get('en')

                if not needs_p and not needs_m:
                    continue

                info = process_word(w['word'])

                if needs_p and info.get('phonetic'):
                    w['phonetic'] = info['phonetic']
                    p_fixed += 1
                    modified = True

                if needs_m and info.get('meaning_en'):
                    if 'meaning' not in w:
                        w['meaning'] = {'zh': '', 'en': ''}
                    w['meaning']['en'] = info['meaning_en']
                    m_fixed += 1
                    modified = True

                time.sleep(0.1)

            if modified:
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f'{subdir}/{filename}: 已更新')

    return p_fixed, m_fixed


def main():
    print('=' * 50)
    print('处理变体词汇')
    print('=' * 50)

    p, m = process_files()
    print(f'\n完成! 补充音标: {p}, 释义: {m}')


if __name__ == '__main__':
    main()
