#!/usr/bin/env python3
"""
使用 CMU 发音词典补充音标
"""
import json
import os
import re

BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src/data/words')
CMU_FILE = '/tmp/cmudict.txt'

# ARPABET 到 IPA 的映射
ARPABET_TO_IPA = {
    'AA': 'ɑː', 'AE': 'æ', 'AH': 'ʌ', 'AO': 'ɔː', 'AW': 'aʊ',
    'AY': 'aɪ', 'B': 'b', 'CH': 'tʃ', 'D': 'd', 'DH': 'ð',
    'EH': 'ɛ', 'ER': 'ɜːr', 'EY': 'eɪ', 'F': 'f', 'G': 'ɡ',
    'HH': 'h', 'IH': 'ɪ', 'IY': 'iː', 'JH': 'dʒ', 'K': 'k',
    'L': 'l', 'M': 'm', 'N': 'n', 'NG': 'ŋ', 'OW': 'oʊ',
    'OY': 'ɔɪ', 'P': 'p', 'R': 'r', 'S': 's', 'SH': 'ʃ',
    'T': 't', 'TH': 'θ', 'UH': 'ʊ', 'UW': 'uː', 'V': 'v',
    'W': 'w', 'Y': 'j', 'Z': 'z', 'ZH': 'ʒ'
}


def load_cmu_dict():
    """加载 CMU 词典"""
    cmu = {}
    with open(CMU_FILE, 'r', encoding='latin-1') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith(';;;'):
                continue
            # 格式: WORD  PH1 PH2 PH3...
            # 或: WORD(1)  PH1 PH2...
            parts = line.split()
            if len(parts) >= 2:
                word = parts[0].lower()
                # 处理变体 (如 read(1), read(2))
                if '(' in word:
                    word = word.split('(')[0]
                if word not in cmu:
                    phonemes = parts[1:]
                    cmu[word] = phonemes
    return cmu


def arpabet_to_ipa(phonemes):
    """将 ARPABET 转换为 IPA"""
    ipa = []
    for p in phonemes:
        # 去掉重音标记 (0, 1, 2)
        base = re.sub(r'\d', '', p)
        if base in ARPABET_TO_IPA:
            ipa.append(ARPABET_TO_IPA[base])
        else:
            ipa.append(base.lower())
    return '/' + ''.join(ipa) + '/'


def process_files(cmu):
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

                word = w['word'].lower()
                # 尝试多种格式匹配
                lookup_variants = [
                    word,
                    word.replace(' ', ''),
                    word.replace('-', ''),
                    word.replace(' ', '-'),
                    word.split()[0] if ' ' in word else None,
                    word.split('-')[0] if '-' in word else None,
                ]

                for variant in lookup_variants:
                    if variant and variant in cmu:
                        w['phonetic'] = arpabet_to_ipa(cmu[variant])
                        fixed += 1
                        break

            if fixed > 0:
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f'{subdir}/{filename}: 补充 {fixed} 个音标')
                total_fixed += fixed

    return total_fixed


def main():
    print('=' * 50)
    print('CMU 发音词典音标补充')
    print('=' * 50)

    print('\n加载 CMU 词典...')
    cmu = load_cmu_dict()
    print(f'CMU 词典: {len(cmu)} 个词条')

    print('\n处理词库文件...')
    fixed = process_files(cmu)
    print(f'\n完成! 补充了 {fixed} 个音标')


if __name__ == '__main__':
    main()
