#!/usr/bin/env python3
"""
将英式音标转换为美式音标

主要转换规则：
1. ɒ → ɑ (lot, hot, stop 等)
2. ɑː → æ (bath, class, dance, ask, last, past 等词，但不包括 father, car 等)
3. 保留词尾 r 音 (美式是 rhotic)
4. əʊ → oʊ (英式 go → 美式)
5. 去掉多余的长音符号在某些位置
"""
import json
import os
import re

BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src/data/words')

# 需要使用 æ 而不是 ɑː 的词（bath词类）
BATH_WORDS = {
    'bath', 'path', 'class', 'glass', 'grass', 'pass', 'past', 'last', 'fast',
    'cast', 'vast', 'mast', 'blast', 'mask', 'task', 'ask', 'basket', 'master',
    'disaster', 'plaster', 'pastor', 'pasture', 'dance', 'chance', 'glance',
    'france', 'lance', 'advance', 'answer', 'can\'t', 'shan\'t', 'aunt',
    'laugh', 'half', 'calf', 'staff', 'graph', 'photograph', 'telegraph',
    'after', 'craft', 'draft', 'shaft', 'daft', 'raft', 'raft', 'branch',
    'ranch', 'demand', 'command', 'sample', 'example', 'plant', 'grant',
    'slant', 'chant', 'advantage', 'banana', 'pyjamas', 'tomato',
    'rather', 'lather', 'gather', 'castle', 'fasten', 'nasty', 'rascal',
    'clasp', 'grasp', 'gasp', 'rasp', 'raspberry'
}


def convert_to_american(phonetic, word):
    """将单个音标转换为美式"""
    if not phonetic:
        return phonetic

    original = phonetic
    word_lower = word.lower()

    # 1. ɒ → ɑ (lot 词类，这在美式中统一为 ɑ)
    phonetic = phonetic.replace('ɒ', 'ɑ')

    # 2. 处理 ɑː
    # 检查是否是 bath 词类（需要转为 æ）
    is_bath_word = any(word_lower.startswith(bw) or word_lower.endswith(bw) or bw in word_lower
                       for bw in BATH_WORDS)

    if is_bath_word:
        # bath 词类: ɑː → æ
        phonetic = phonetic.replace('ɑː', 'æ')

    # 3. əʊ → oʊ (英式的 go 发音转美式)
    phonetic = phonetic.replace('əʊ', 'oʊ')

    # 4. 清理一些格式问题
    # 去掉方括号，统一用斜杠
    if phonetic.startswith('[') and phonetic.endswith(']'):
        phonetic = '/' + phonetic[1:-1] + '/'

    # 确保有斜杠包围
    if phonetic and not phonetic.startswith('/') and not phonetic.startswith('['):
        phonetic = '/' + phonetic + '/'

    # 去掉重复的斜杠
    phonetic = phonetic.replace('//', '/')

    return phonetic


def process_files():
    """处理所有词库文件"""
    total_converted = 0

    for subdir in ['cefr', 'china']:
        dir_path = os.path.join(BASE_PATH, subdir)
        for filename in sorted(os.listdir(dir_path)):
            if not filename.endswith('.json'):
                continue

            filepath = os.path.join(dir_path, filename)
            with open(filepath, 'r') as f:
                data = json.load(f)

            converted = 0
            for w in data['words']:
                if w.get('phonetic'):
                    original = w['phonetic']
                    new_phonetic = convert_to_american(original, w['word'])
                    if new_phonetic != original:
                        w['phonetic'] = new_phonetic
                        converted += 1

            if converted > 0:
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f'{subdir}/{filename}: 转换 {converted} 个音标')
                total_converted += converted

    return total_converted


def main():
    print('=' * 50)
    print('转换为美式英语音标')
    print('=' * 50)
    print()
    print('转换规则:')
    print('  ɒ → ɑ (lot, hot, stop)')
    print('  ɑː → æ (bath, class, dance 等词)')
    print('  əʊ → oʊ (go, home)')
    print()

    converted = process_files()
    print(f'\n完成! 共转换 {converted} 个音标')


if __name__ == '__main__':
    main()
