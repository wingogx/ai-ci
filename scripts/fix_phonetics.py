#!/usr/bin/env python3
"""
专门补充缺失音标的脚本
"""
import subprocess
import json
import time
import os
import re

BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src/data/words')


def get_phonetic_from_api(word):
    """尝试从 Free Dictionary API 获取音标"""
    # 对于复合词，尝试多种格式
    variants = [word]
    if ' ' in word:
        variants.append(word.replace(' ', '-'))
        variants.append(word.replace(' ', ''))
        # 只取第一个词
        variants.append(word.split()[0])
    if '-' in word:
        variants.append(word.replace('-', ''))
        variants.append(word.split('-')[0])

    for variant in variants:
        try:
            result = subprocess.run(
                ['curl', '-s', '--max-time', '3',
                 f'https://api.dictionaryapi.dev/api/v2/entries/en/{variant}'],
                capture_output=True, text=True
            )
            if result.returncode == 0 and result.stdout:
                data = json.loads(result.stdout)
                if isinstance(data, list) and len(data) > 0:
                    entry = data[0]
                    for p in entry.get('phonetics', []):
                        if p.get('text'):
                            return p['text']
        except:
            pass
    return None


def process_all_files():
    """处理所有词库文件"""
    total_fixed = 0
    total_missing = 0

    for subdir in ['cefr', 'china']:
        dir_path = os.path.join(BASE_PATH, subdir)
        for filename in sorted(os.listdir(dir_path)):
            if not filename.endswith('.json'):
                continue

            filepath = os.path.join(dir_path, filename)
            with open(filepath, 'r') as f:
                data = json.load(f)

            # 找出缺少音标的词
            missing_indices = []
            for i, w in enumerate(data['words']):
                if not w.get('phonetic'):
                    missing_indices.append(i)

            if not missing_indices:
                continue

            print(f"\n{subdir}/{filename}: 缺少 {len(missing_indices)} 个音标")
            total_missing += len(missing_indices)

            fixed = 0
            for idx in missing_indices:
                word = data['words'][idx]['word']
                phonetic = get_phonetic_from_api(word)
                if phonetic:
                    data['words'][idx]['phonetic'] = phonetic
                    fixed += 1
                time.sleep(0.1)

                if (missing_indices.index(idx) + 1) % 20 == 0:
                    print(f"  进度: {missing_indices.index(idx)+1}/{len(missing_indices)}, 已修复: {fixed}")

            if fixed > 0:
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f"  完成: 修复 {fixed} 个")
                total_fixed += fixed

    return total_fixed, total_missing


def main():
    print("=" * 50)
    print("音标补充工具 (重新尝试)")
    print("=" * 50)

    fixed, missing = process_all_files()
    print(f"\n总计: 尝试 {missing} 个, 修复 {fixed} 个")


if __name__ == '__main__':
    main()
