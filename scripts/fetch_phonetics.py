#!/usr/bin/env python3
"""
批量获取缺失词汇的音标
使用有道词典 API

运行方式:
  python3 scripts/fetch_phonetics.py
"""
import subprocess
import json
import time
import os
import urllib.parse

BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src/data/words')
PROGRESS_FILE = '/tmp/phonetic_fetch_progress.json'

# 需要补充音标的词库
WORD_FILES = [
    'cefr/c2.json',
    'cefr/c1.json',
]


def get_phonetic_from_youdao(word):
    """从有道词典获取音标"""
    try:
        url = f'https://dict.youdao.com/jsonapi?q={urllib.parse.quote(word)}'
        result = subprocess.run(
            ['curl', '-s', '--max-time', '8', url],
            capture_output=True, text=True
        )
        if result.returncode == 0 and result.stdout:
            data = json.loads(result.stdout)
            # 尝试从 ec 字典获取音标
            ec = data.get('ec', {})
            if ec and 'word' in ec:
                word_data = ec['word'][0]
                # 优先美式音标，其次英式
                phonetic = word_data.get('usphone') or word_data.get('ukphone')
                if phonetic:
                    return f'/{phonetic}/'
    except Exception as e:
        pass
    return None


def find_missing_phonetics():
    """查找缺少音标的词汇"""
    missing = []
    for file_path in WORD_FILES:
        filepath = os.path.join(BASE_PATH, file_path)
        if not os.path.exists(filepath):
            continue
        with open(filepath, 'r') as f:
            data = json.load(f)
        for w in data['words']:
            if not w.get('phonetic', '').strip():
                missing.append({
                    'word': w['word'].lower(),
                    'id': w['id'],
                    'file': file_path
                })
    return missing


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
    for file_path in WORD_FILES:
        filepath = os.path.join(BASE_PATH, file_path)
        if not os.path.exists(filepath):
            continue

        with open(filepath, 'r') as f:
            data = json.load(f)

        modified = False
        for w in data['words']:
            word = w['word'].lower()
            if word in processed and processed[word]:
                if not w.get('phonetic', '').strip():
                    w['phonetic'] = processed[word]
                    modified = True

        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    print("=" * 50)
    print("音标补充工具")
    print("=" * 50)

    # 查找缺失的词汇
    missing_words = find_missing_phonetics()
    print(f"\n缺少音标的词汇: {len(missing_words)} 个")

    # 加载已处理的进度
    processed = load_progress()
    print(f"已处理: {len(processed)} 个")

    # 筛选未处理的词（去重）
    seen = set()
    remaining = []
    for w in missing_words:
        word = w['word']
        if word not in processed and word not in seen:
            remaining.append(w)
            seen.add(word)

    print(f"待处理: {len(remaining)} 个")

    if not remaining:
        print("\n所有词汇已处理完成!")
        return

    print(f"\n开始处理...")
    print("数据源: 有道词典 API\n")

    success_count = 0
    try:
        for i, item in enumerate(remaining):
            word = item['word']
            phonetic = get_phonetic_from_youdao(word)

            if phonetic:
                processed[word] = phonetic
                success_count += 1
                print(f"  {word}: {phonetic}")
            else:
                processed[word] = ''  # 标记为已尝试

            time.sleep(0.2)

            # 每 30 个词保存一次进度
            if (i + 1) % 30 == 0:
                save_progress(processed)
                update_word_files(processed)

    except KeyboardInterrupt:
        print("\n\n中断! 保存进度...")

    # 最终保存
    save_progress(processed)
    update_word_files(processed)

    print(f"\n完成! 成功获取: {success_count} 个词的音标")

    # 统计结果
    print("\n=== 最终统计 ===")
    for file_path in WORD_FILES:
        filepath = os.path.join(BASE_PATH, file_path)
        if not os.path.exists(filepath):
            continue
        with open(filepath, 'r') as f:
            data = json.load(f)
        with_phonetic = sum(1 for w in data['words'] if w.get('phonetic', '').strip())
        total = len(data['words'])
        print(f"{file_path}: {with_phonetic}/{total} ({with_phonetic*100/total:.1f}%) 有音标")


if __name__ == '__main__':
    main()
