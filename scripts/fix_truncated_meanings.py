#!/usr/bin/env python3
"""
修复被截断的中文释义
找出所有包含 "..." 的释义，重新从有道词典获取完整释义

运行方式:
  python3 scripts/fix_truncated_meanings.py
"""
import json
import time
import os
import re
import urllib.parse
import subprocess

BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src/data/words')
PROGRESS_FILE = '/tmp/fix_truncated_progress.json'

# 词库文件列表
WORD_FILES = [
    ('cefr', 'a1.json'),
    ('cefr', 'a2.json'),
    ('cefr', 'b1.json'),
    ('cefr', 'b2.json'),
    ('cefr', 'c1.json'),
    ('cefr', 'c2.json'),
    ('china', 'primary.json'),
    ('china', 'junior.json'),
    ('china', 'senior.json'),
    ('china', 'cet4.json'),
    ('china', 'cet6.json'),
]


def get_meaning_from_youdao(word):
    """从有道词典获取完整中英文释义 (使用 curl 避免 SSL 问题)"""
    try:
        url = f'https://dict.youdao.com/jsonapi?q={urllib.parse.quote(word)}'
        result_proc = subprocess.run(
            ['curl', '-s', '--max-time', '10', url],
            capture_output=True, text=True
        )
        if result_proc.returncode != 0 or not result_proc.stdout:
            return {'zh': None, 'en': None}

        data = json.loads(result_proc.stdout)
        result = {'zh': None, 'en': None}

        # 获取中文释义 (ec = English-Chinese)
        ec = data.get('ec', {})
        if ec and 'word' in ec and ec['word']:
            word_data = ec['word'][0]
            trs = word_data.get('trs', [])
            if trs:
                meanings = []
                for tr_item in trs:
                    tr_list = tr_item.get('tr', [])
                    for t in tr_list:
                        l_data = t.get('l', {})
                        i_list = l_data.get('i', [])
                        if i_list and isinstance(i_list, list) and i_list[0]:
                            meaning = i_list[0]
                            # 清理 HTML 标签
                            meaning = re.sub(r'<[^>]+>', '', meaning)
                            meanings.append(meaning)
                if meanings:
                    # 合并所有词性的释义
                    result['zh'] = '; '.join(meanings)

        # 获取英文释义 (ee = English-English)
        ee = data.get('ee', {})
        if ee and 'word' in ee and ee['word']:
            word_data = ee['word']
            trs = word_data.get('trs', [])
            if trs:
                meanings = []
                for tr_item in trs:
                    pos = tr_item.get('pos', '')
                    tr_list = tr_item.get('tr', [])
                    for t in tr_list:
                        l_data = t.get('l', {})
                        i_data = l_data.get('i', '')
                        if i_data:
                            if pos:
                                meanings.append(f"{pos} {i_data}")
                            else:
                                meanings.append(i_data)
                if meanings:
                    result['en'] = '; '.join(meanings[:4])

        return result
    except Exception as e:
        return {'zh': None, 'en': None}


def get_meaning_from_free_dict(word):
    """从 Free Dictionary API 获取英文释义 (使用 curl)"""
    try:
        url = f'https://api.dictionaryapi.dev/api/v2/entries/en/{urllib.parse.quote(word)}'
        result_proc = subprocess.run(
            ['curl', '-s', '--max-time', '10', url],
            capture_output=True, text=True
        )
        if result_proc.returncode != 0 or not result_proc.stdout:
            return None

        data = json.loads(result_proc.stdout)
        if data and isinstance(data, list):
            meanings = []
            for entry in data[:1]:
                for meaning in entry.get('meanings', [])[:3]:
                    pos = meaning.get('partOfSpeech', '')
                    for defn in meaning.get('definitions', [])[:2]:
                        definition = defn.get('definition', '')
                        if definition:
                            if pos:
                                meanings.append(f"{pos}. {definition}")
                            else:
                                meanings.append(definition)
            if meanings:
                return '; '.join(meanings[:4])
        return None
    except:
        return None


def find_truncated_words():
    """找出所有被截断的释义"""
    truncated = []

    for subdir, filename in WORD_FILES:
        filepath = os.path.join(BASE_PATH, subdir, filename)
        if not os.path.exists(filepath):
            continue

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for w in data['words']:
            meaning = w.get('meaning', {})
            zh = meaning.get('zh', '')
            en = meaning.get('en', '')

            # 检查是否被截断
            if (zh and zh.endswith('...')) or (en and en.endswith('...')):
                truncated.append({
                    'word': w['word'],
                    'id': w['id'],
                    'file': f'{subdir}/{filename}',
                    'zh_truncated': zh.endswith('...') if zh else False,
                    'en_truncated': en.endswith('...') if en else False,
                })

    return truncated


def load_progress():
    """加载进度"""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {'processed': {}, 'stats': {'success': 0, 'failed': 0}}


def save_progress(progress):
    """保存进度"""
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


def update_word_file(subdir, filename, updates):
    """更新单个词库文件"""
    filepath = os.path.join(BASE_PATH, subdir, filename)

    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    modified = False
    for w in data['words']:
        word_key = w['word'].lower()
        if word_key in updates:
            update = updates[word_key]
            if update.get('zh') and w.get('meaning', {}).get('zh', '').endswith('...'):
                w['meaning']['zh'] = update['zh']
                modified = True
            if update.get('en') and w.get('meaning', {}).get('en', '').endswith('...'):
                w['meaning']['en'] = update['en']
                modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    return False


def main():
    import sys
    sys.stdout.reconfigure(line_buffering=True)  # 确保实时输出

    print("=" * 60)
    print("修复被截断的释义")
    print("=" * 60)
    print("正在扫描词库文件...", flush=True)

    # 找出所有被截断的词
    truncated = find_truncated_words()
    print(f"\n发现 {len(truncated)} 个被截断的释义", flush=True)

    # 按文件分组统计
    file_stats = {}
    for item in truncated:
        file_stats[item['file']] = file_stats.get(item['file'], 0) + 1

    print("\n各词库截断数量:")
    for f, count in sorted(file_stats.items()):
        print(f"  {f}: {count}")

    # 加载进度
    progress = load_progress()
    processed = progress['processed']
    print(f"\n已处理: {len(processed)} 个")

    # 筛选未处理的词
    remaining = [w for w in truncated if w['word'].lower() not in processed]
    print(f"待处理: {len(remaining)} 个")

    if not remaining:
        print("\n所有词汇已处理完成!")
        return

    print(f"\n开始处理... (预计需要 {len(remaining) * 0.5 / 60:.1f} 分钟)")
    print("数据源: 有道词典 API + Free Dictionary API")
    print("按 Ctrl+C 可中断，下次运行会继续\n")

    success_count = 0
    failed_count = 0

    # 按文件分组处理
    file_groups = {}
    for item in remaining:
        file_key = item['file']
        if file_key not in file_groups:
            file_groups[file_key] = []
        file_groups[file_key].append(item)

    try:
        for file_key, items in file_groups.items():
            subdir, filename = file_key.split('/')
            print(f"\n处理 {file_key} ({len(items)} 个词)")

            file_updates = {}

            for i, item in enumerate(items):
                word = item['word']
                word_key = word.lower()

                # 获取释义
                result = get_meaning_from_youdao(word)

                # 如果英文释义需要修复但有道没返回，尝试 Free Dictionary
                if item['en_truncated'] and not result['en']:
                    en_from_free = get_meaning_from_free_dict(word)
                    if en_from_free:
                        result['en'] = en_from_free

                # 记录结果
                if result['zh'] or result['en']:
                    file_updates[word_key] = result
                    processed[word_key] = result
                    success_count += 1
                    status = "✓"
                else:
                    processed[word_key] = {'zh': None, 'en': None}
                    failed_count += 1
                    status = "✗"

                # 显示进度
                if (i + 1) % 10 == 0 or i == len(items) - 1:
                    print(f"  进度: {i+1}/{len(items)} | 成功: {success_count} | 失败: {failed_count}")

                time.sleep(0.3)  # 避免请求过快

                # 每 50 个词保存一次
                if (i + 1) % 50 == 0:
                    update_word_file(subdir, filename, file_updates)
                    progress['processed'] = processed
                    progress['stats'] = {'success': success_count, 'failed': failed_count}
                    save_progress(progress)

            # 处理完一个文件后保存
            update_word_file(subdir, filename, file_updates)
            progress['processed'] = processed
            progress['stats'] = {'success': success_count, 'failed': failed_count}
            save_progress(progress)

    except KeyboardInterrupt:
        print("\n\n中断! 保存进度...")

    # 最终保存
    progress['processed'] = processed
    progress['stats'] = {'success': success_count, 'failed': failed_count}
    save_progress(progress)

    print(f"\n{'=' * 60}")
    print(f"完成! 成功: {success_count}, 失败: {failed_count}")
    print(f"{'=' * 60}")

    # 验证结果
    print("\n=== 验证修复结果 ===")
    remaining_truncated = find_truncated_words()
    print(f"剩余截断释义: {len(remaining_truncated)} 个")


if __name__ == '__main__':
    main()
