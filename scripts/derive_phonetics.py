#!/usr/bin/env python3
"""
基于词根派生音标
对于 -ly, -ness, -ish 等后缀的词，从基础词派生音标
"""
import json
import os
import re

BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src/data/words')

# 后缀及其 IPA 发音
SUFFIX_IPA = {
    'ly': 'li',
    'ness': 'nəs',
    'ish': 'ɪʃ',
    'ment': 'mənt',
    'tion': 'ʃən',
    'sion': 'ʒən',
    'able': 'əbl',
    'ible': 'əbl',
    'ful': 'fəl',
    'less': 'ləs',
    'ity': 'ɪti',
    'ive': 'ɪv',
    'ous': 'əs',
    'al': 'əl',
    'er': 'ər',
    'or': 'ər',
    'ist': 'ɪst',
    'ism': 'ɪzəm',
    'ary': 'əri',
    'ery': 'əri',
    'ory': 'əri',
    'ic': 'ɪk',
    'ical': 'ɪkəl',
    'ity': 'ɪti',
}


def load_all_phonetics():
    """加载所有已有音标的词"""
    phonetics = {}
    for subdir in ['cefr', 'china']:
        dir_path = os.path.join(BASE_PATH, subdir)
        for filename in os.listdir(dir_path):
            if not filename.endswith('.json'):
                continue
            filepath = os.path.join(dir_path, filename)
            with open(filepath, 'r') as f:
                data = json.load(f)
            for w in data['words']:
                if w.get('phonetic'):
                    phonetics[w['word'].lower()] = w['phonetic']
    return phonetics


def derive_phonetic(word, known_phonetics):
    """尝试从已知词派生音标"""
    word = word.lower()

    # 检查各种后缀
    for suffix, suffix_ipa in sorted(SUFFIX_IPA.items(), key=lambda x: -len(x[0])):
        if word.endswith(suffix) and len(word) > len(suffix) + 2:
            base = word[:-len(suffix)]

            # 尝试各种变体
            variants = [
                base,
                base + 'e',  # lovely -> love
                base + base[-1],  # running -> run + n
                base[:-1] if base.endswith('i') else None,  # easily -> easy (y->i)
                base + 'y' if base.endswith('i') else None,  # easily -> easy
            ]

            for variant in variants:
                if variant and variant in known_phonetics:
                    base_phonetic = known_phonetics[variant]
                    # 移除结尾的 / 并添加后缀发音
                    if base_phonetic.endswith('/'):
                        new_phonetic = base_phonetic[:-1] + suffix_ipa + '/'
                        return new_phonetic

    return None


def process_files(known_phonetics):
    """处理所有词库文件"""
    total_fixed = 0

    for subdir in ['cefr', 'china']:
        dir_path = os.path.join(BASE_PATH, subdir)
        for filename in sorted(os.listdir(dir_path)):
            if not filename.endswith('.json'):
                continue

            filepath = os.path.join(dir_path, filename)
            with open(filepath, 'r') as f:
                data = json.load(f)

            fixed = 0
            for w in data['words']:
                if w.get('phonetic'):
                    continue

                derived = derive_phonetic(w['word'], known_phonetics)
                if derived:
                    w['phonetic'] = derived
                    fixed += 1

            if fixed > 0:
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f'{subdir}/{filename}: 派生 {fixed} 个音标')
                total_fixed += fixed

    return total_fixed


def main():
    print('=' * 50)
    print('派生词音标补充')
    print('=' * 50)

    print('\n加载已有音标...')
    known = load_all_phonetics()
    print(f'已有音标: {len(known)} 个词')

    print('\n派生音标...')
    fixed = process_files(known)
    print(f'\n完成! 派生了 {fixed} 个音标')


if __name__ == '__main__':
    main()
