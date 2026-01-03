#!/usr/bin/env python3
"""
使用 CMU Pronouncing Dictionary 补充音标
CMU 词典是公开的发音词典，包含 13 万+ 词汇
"""
import subprocess
import json
import os
import re

BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src/data/words')
CMU_URL = 'https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict'
CMU_CACHE = '/tmp/cmudict.txt'

# ARPABET 到 IPA 的映射
ARPABET_TO_IPA = {
    'AA': 'ɑ', 'AE': 'æ', 'AH': 'ʌ', 'AO': 'ɔ', 'AW': 'aʊ',
    'AY': 'aɪ', 'B': 'b', 'CH': 'tʃ', 'D': 'd', 'DH': 'ð',
    'EH': 'ɛ', 'ER': 'ɜr', 'EY': 'eɪ', 'F': 'f', 'G': 'ɡ',
    'HH': 'h', 'IH': 'ɪ', 'IY': 'i', 'JH': 'dʒ', 'K': 'k',
    'L': 'l', 'M': 'm', 'N': 'n', 'NG': 'ŋ', 'OW': 'oʊ',
    'OY': 'ɔɪ', 'P': 'p', 'R': 'r', 'S': 's', 'SH': 'ʃ',
    'T': 't', 'TH': 'θ', 'UH': 'ʊ', 'UW': 'u', 'V': 'v',
    'W': 'w', 'Y': 'j', 'Z': 'z', 'ZH': 'ʒ'
}


def download_cmu_dict():
    """下载 CMU 词典"""
    if os.path.exists(CMU_CACHE):
        print("使用缓存的 CMU 词典")
        return True

    print("下载 CMU Pronouncing Dictionary...")
    result = subprocess.run(
        ['curl', '-s', '-L', '--max-time', '60', '-o', CMU_CACHE, CMU_URL],
        capture_output=True
    )
    if result.returncode == 0 and os.path.exists(CMU_CACHE):
        print("下载完成")
        return True
    print("下载失败")
    return False


def load_cmu_dict():
    """加载 CMU 词典"""
    cmu = {}
    with open(CMU_CACHE, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith(';;;'):
                continue
            parts = line.split()
            if len(parts) >= 2:
                word = parts[0].lower()
                # 处理带数字后缀的变体 (如 read(1), read(2))
                if '(' in word:
                    word = word.split('(')[0]
                if word not in cmu:  # 只保留第一个发音
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


def find_missing_phonetics():
    """查找缺少音标的词汇"""
    missing = {}
    for subdir in ['cefr', 'china']:
        dir_path = os.path.join(BASE_PATH, subdir)
        for filename in os.listdir(dir_path):
            if not filename.endswith('.json'):
                continue
            filepath = os.path.join(dir_path, filename)
            with open(filepath, 'r') as f:
                data = json.load(f)
            for i, w in enumerate(data['words']):
                if not w.get('phonetic'):
                    word = w['word'].lower()
                    key = f'{subdir}/{filename}'
                    if key not in missing:
                        missing[key] = []
                    missing[key].append((i, word))
    return missing


def update_files(missing, cmu):
    """更新词库文件"""
    updated_count = 0

    for file_key, words in missing.items():
        subdir, filename = file_key.split('/')
        filepath = os.path.join(BASE_PATH, subdir, filename)

        with open(filepath, 'r') as f:
            data = json.load(f)

        modified = False
        for idx, word in words:
            # 尝试直接匹配
            lookup_word = word.replace(' ', '-').replace("'", '')
            if lookup_word in cmu:
                ipa = arpabet_to_ipa(cmu[lookup_word])
                data['words'][idx]['phonetic'] = ipa
                modified = True
                updated_count += 1
            elif word.replace(' ', '') in cmu:
                ipa = arpabet_to_ipa(cmu[word.replace(' ', '')])
                data['words'][idx]['phonetic'] = ipa
                modified = True
                updated_count += 1

        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

    return updated_count


def main():
    print("=" * 50)
    print("CMU 发音词典音标补充工具")
    print("=" * 50)

    if not download_cmu_dict():
        return

    print("\n加载 CMU 词典...")
    cmu = load_cmu_dict()
    print(f"CMU 词典包含 {len(cmu)} 个词汇")

    print("\n查找缺少音标的词汇...")
    missing = find_missing_phonetics()
    total_missing = sum(len(v) for v in missing.values())
    print(f"缺少音标: {total_missing} 个")

    if total_missing == 0:
        print("所有词汇都有音标!")
        return

    print("\n更新词库...")
    updated = update_files(missing, cmu)
    print(f"\n完成! 补充了 {updated} 个词的音标")


if __name__ == '__main__':
    main()
