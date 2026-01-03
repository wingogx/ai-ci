#!/usr/bin/env python3
"""
最终清理 - 尝试补充所有剩余的音标和释义
"""
import subprocess
import json
import time
import os

BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src/data/words')


def get_from_api(word):
    """从多个 API 获取信息"""
    result = {'phonetic': None, 'meaning_en': None}

    # 尝试 Free Dictionary API
    try:
        variants = [word, word.replace(' ', '-'), word.replace('-', ''), word.split()[0] if ' ' in word else word]
        for variant in variants:
            resp = subprocess.run(
                ['curl', '-s', '--max-time', '3',
                 f'https://api.dictionaryapi.dev/api/v2/entries/en/{variant}'],
                capture_output=True, text=True
            )
            if resp.returncode == 0 and resp.stdout and not resp.stdout.startswith('{'):
                data = json.loads(resp.stdout)
                if isinstance(data, list) and len(data) > 0:
                    entry = data[0]
                    for p in entry.get('phonetics', []):
                        if p.get('text') and not result['phonetic']:
                            result['phonetic'] = p['text']
                    for m in entry.get('meanings', []):
                        for d in m.get('definitions', []):
                            if d.get('definition') and not result['meaning_en']:
                                meaning = d['definition']
                                if len(meaning) > 60:
                                    meaning = meaning[:57] + '...'
                                result['meaning_en'] = meaning
                                break
                        if result['meaning_en']:
                            break
                    if result['phonetic'] or result['meaning_en']:
                        break
    except:
        pass

    # 如果还缺释义，尝试 Datamuse
    if not result['meaning_en']:
        try:
            resp = subprocess.run(
                ['curl', '-s', '--max-time', '3',
                 f'https://api.datamuse.com/words?sp={word}&md=d&max=1'],
                capture_output=True, text=True
            )
            if resp.returncode == 0 and resp.stdout:
                data = json.loads(resp.stdout)
                if data and 'defs' in data[0]:
                    defs = data[0]['defs']
                    if defs:
                        meaning = defs[0].split('\t')[-1] if '\t' in defs[0] else defs[0]
                        if len(meaning) > 60:
                            meaning = meaning[:57] + '...'
                        result['meaning_en'] = meaning
        except:
            pass

    return result


def process_files():
    """处理所有文件"""
    phonetic_fixed = 0
    meaning_fixed = 0

    for subdir in ['cefr', 'china']:
        dir_path = os.path.join(BASE_PATH, subdir)
        for filename in sorted(os.listdir(dir_path)):
            if not filename.endswith('.json'):
                continue

            filepath = os.path.join(dir_path, filename)
            with open(filepath, 'r') as f:
                data = json.load(f)

            # 找出缺失的词
            missing = []
            for i, w in enumerate(data['words']):
                needs_phonetic = not w.get('phonetic')
                needs_meaning = not w.get('meaning', {}).get('en')
                if needs_phonetic or needs_meaning:
                    missing.append((i, w['word'], needs_phonetic, needs_meaning))

            if not missing:
                continue

            print(f'\n{subdir}/{filename}: {len(missing)} 个需要补充')

            p_count = 0
            m_count = 0
            for idx, word, needs_p, needs_m in missing:
                info = get_from_api(word)

                if needs_p and info['phonetic']:
                    data['words'][idx]['phonetic'] = info['phonetic']
                    p_count += 1

                if needs_m and info['meaning_en']:
                    if 'meaning' not in data['words'][idx]:
                        data['words'][idx]['meaning'] = {'zh': '', 'en': ''}
                    data['words'][idx]['meaning']['en'] = info['meaning_en']
                    m_count += 1

                time.sleep(0.1)

            if p_count > 0 or m_count > 0:
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f'  补充: 音标 {p_count}, 释义 {m_count}')
                phonetic_fixed += p_count
                meaning_fixed += m_count

    return phonetic_fixed, meaning_fixed


def main():
    print('=' * 50)
    print('最终清理 - 补充剩余音标和释义')
    print('=' * 50)

    p, m = process_files()
    print(f'\n完成! 补充音标: {p}, 释义: {m}')


if __name__ == '__main__':
    main()
