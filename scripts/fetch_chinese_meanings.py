#!/usr/bin/env python3
"""
批量获取缺失词汇的中文释义
使用有道词典 API

运行方式:
  python3 scripts/fetch_chinese_meanings.py

注意: 由于 API 限制，完整运行可能需要较长时间
"""
import subprocess
import json
import time
import os
import re
import urllib.parse

BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src/data/words')
PROGRESS_FILE = '/tmp/chinese_fetch_progress.json'


def get_chinese_from_youdao(word):
    """从有道词典获取中文释义"""
    try:
        url = f'https://dict.youdao.com/jsonapi?q={urllib.parse.quote(word)}'
        result = subprocess.run(
            ['curl', '-s', '--max-time', '8', url],
            capture_output=True, text=True
        )
        if result.returncode == 0 and result.stdout:
            data = json.loads(result.stdout)
            # 尝试从 ec 字典获取
            ec = data.get('ec', {})
            if ec and 'word' in ec:
                trs = ec['word'][0].get('trs', [])
                if trs:
                    tr = trs[0].get('tr', [])
                    if tr:
                        meaning = tr[0].get('l', {}).get('i', [''])[0]
                        if meaning:
                            # 清理释义
                            meaning = re.sub(r'<[^>]+>', '', meaning)
                            if len(meaning) > 50:
                                meaning = meaning[:47] + '...'
                            return meaning
            # 尝试从 fanyi 获取
            fanyi = data.get('fanyi', {})
            if fanyi and 'tran' in fanyi:
                return fanyi['tran'][:50]
    except Exception as e:
        pass
    return None


def get_chinese_from_iciba(word):
    """从金山词霸获取中文释义"""
    try:
        url = f'http://dict-co.iciba.com/api/dictionary.php?w={urllib.parse.quote(word)}&key=free&type=json'
        result = subprocess.run(
            ['curl', '-s', '--max-time', '8', url],
            capture_output=True, text=True
        )
        if result.returncode == 0 and result.stdout:
            data = json.loads(result.stdout)
            symbols = data.get('symbols', [])
            if symbols:
                parts = symbols[0].get('parts', [])
                if parts:
                    means = parts[0].get('means', [])
                    if means:
                        meaning = means[0] if isinstance(means[0], str) else str(means[0])
                        if len(meaning) > 50:
                            meaning = meaning[:47] + '...'
                        return meaning
    except:
        pass
    return None


def find_missing_chinese():
    """查找缺少中文释义的词汇"""
    missing = []
    for subdir in ['china']:  # 只处理中国教材词库
        dir_path = os.path.join(BASE_PATH, subdir)
        for filename in ['cet4.json', 'cet6.json']:  # 只处理 CET4/CET6
            filepath = os.path.join(dir_path, filename)
            if not os.path.exists(filepath):
                continue
            with open(filepath, 'r') as f:
                data = json.load(f)
            for w in data['words']:
                if len(w['word']) >= 3 and (not w.get('meaning', {}).get('zh') or w['meaning']['zh'].strip() == ''):
                    missing.append({
                        'word': w['word'].lower(),
                        'id': w['id'],
                        'file': f'{subdir}/{filename}'
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
    for filename in ['cet4.json', 'cet6.json']:
        filepath = os.path.join(BASE_PATH, 'china', filename)
        with open(filepath, 'r') as f:
            data = json.load(f)

        modified = False
        for w in data['words']:
            word = w['word'].lower()
            if word in processed and processed[word]:
                zh = processed[word]
                if not w.get('meaning', {}).get('zh') or w['meaning']['zh'].strip() == '':
                    if 'meaning' not in w:
                        w['meaning'] = {'zh': '', 'en': ''}
                    w['meaning']['zh'] = zh
                    modified = True

        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    print("=" * 50)
    print("中文释义补充工具")
    print("=" * 50)

    # 查找缺失的词汇
    missing_words = find_missing_chinese()
    print(f"\n缺少中文释义的词汇: {len(missing_words)} 个")

    # 加载已处理的进度
    processed = load_progress()
    print(f"已处理: {len(processed)} 个")

    # 筛选未处理的词
    remaining = [w for w in missing_words if w['word'] not in processed]
    print(f"待处理: {len(remaining)} 个")

    if not remaining:
        print("\n所有词汇已处理完成!")
        return

    print(f"\n开始处理... (预计需要 {len(remaining) * 0.3 / 60:.1f} 分钟)")
    print("数据源: 有道词典 API + 金山词霸 API")
    print("按 Ctrl+C 可中断，下次运行会继续\n")

    success_count = 0
    try:
        for i, item in enumerate(remaining):
            word = item['word']

            # 先尝试有道
            zh = get_chinese_from_youdao(word)

            # 如果有道失败，尝试金山
            if not zh:
                zh = get_chinese_from_iciba(word)
                time.sleep(0.1)

            if zh:
                processed[word] = zh
                success_count += 1
            else:
                processed[word] = ''  # 标记为已尝试

            time.sleep(0.2)  # 避免请求过快

            # 每 50 个词保存一次进度
            if (i + 1) % 50 == 0:
                save_progress(processed)
                update_word_files(processed)
                print(f"  进度: {i+1}/{len(remaining)}, 成功: {success_count}")

    except KeyboardInterrupt:
        print("\n\n中断! 保存进度...")

    # 最终保存
    save_progress(processed)
    update_word_files(processed)

    print(f"\n完成! 成功获取: {success_count} 个词的中文释义")
    print("词库文件已更新")

    # 统计结果
    print("\n=== 最终统计 ===")
    for filename in ['cet4.json', 'cet6.json']:
        filepath = os.path.join(BASE_PATH, 'china', filename)
        with open(filepath, 'r') as f:
            data = json.load(f)
        with_zh = sum(1 for w in data['words'] if w.get('meaning', {}).get('zh'))
        print(f"{filename}: {with_zh}/{len(data['words'])} 有中文释义")


if __name__ == '__main__':
    main()
