import json, urllib.request, time, re, argparse
from pathlib import Path

cfg=json.loads((Path.home()/'.openclaw/openclaw.json').read_text())

TESTS = [
  (2, 'constraint_cn14', '请写一句中文，必须同时满足：\n1. 恰好14个汉字\n2. 不能包含“的”“了”“是”\n3. 要表达“今天适合专心做复杂工作”\n4. 不能带标点'),
  (4, 'self_check_math', '先回答：19 × 27 = ?\n然后立刻重新检查你自己的答案一遍，如果第一次错了就纠正，如果第一次对了就只输出“已复核无误：<答案>”。'),
  (6, 'multi_step_string', '把单词 `strawberry` 按下面规则处理：\n1. 先全部转大写\n2. 删除第 3 个字符\n3. 在结果末尾追加 `_42`\n只输出最终结果，不要解释'),
  (7, 'rule_pack_22cn', '请先记住以下 6 条规则，并在最终答案里全部遵守：\n1. 用中文回答\n2. 只回答一行\n3. 恰好 22 个汉字\n4. 不能出现数字\n5. 不能出现“模型”二字\n6. 意思是“我已经完成检查，可以继续下一步”'),
  (8, 'logic_simple', '有三个人：甲、乙、丙。已知：甲比乙高，丙比甲矮。问：三人中最高的是谁？只输出名字，不要解释。'),
  (10, 'two_sentence_constraints', '请用两句话总结“为什么长 session 会导致排障体验变差”，要求：\n- 每句话 18 到 24 个汉字\n- 不要出现英文\n- 不要出现“上下文”三个字\n- 第二句必须包含“压缩”二字'),
  (11, 'json_schema', '只输出 JSON，不要加代码块，不要解释。格式必须是：{"city":"<城市>","temp_c":<整数>,"ok":true}'),
  (13, 'count_letters', '单词 strawberry 中字母 r 出现了几次？只输出数字。'),
  (22, 'newline_control', '请输出两行，第一行是 alpha，第二行是 beta，不能多也不能少。'),
  (29, 'multi_constraint_summary', '请写一句中文，表达“先压缩信息再继续处理”，要求：\n1. 14到18个汉字\n2. 不能出现“信息”\n3. 不能出现标点')
]

def count_cjk(s):
    return sum(1 for ch in s if '\u4e00' <= ch <= '\u9fff')

def score_case(case_id, out):
    text=out.strip()
    if case_id==2:
        banned = any(x in text for x in '的是了')
        cjk = count_cjk(text)
        return 2 if cjk==14 and not banned and ('做' in text or '专心' in text or '复杂' in text) and all(p not in text for p in '，。！？,.!?') else 1 if cjk>=10 else 0
    elif case_id==4:
        return 2 if text=='已复核无误：513' else 1 if '513' in text else 0
    elif case_id==6:
        return 2 if text=='STAWBERRY_42' else 0
    elif case_id==7:
        cjk=count_cjk(text)
        return 2 if cjk==22 and '模型' not in text and not re.search(r'\d', text) and '\n' not in text else 1 if cjk>=18 else 0
    elif case_id==8:
        return 2 if text=='甲' else 0
    elif case_id==10:
        lines=[x for x in text.splitlines() if x.strip()]
        ok=len(lines)==2 and '压缩' in lines[-1] and 'session' not in text.lower() and '上下文' not in text
        return 2 if ok else 1 if len(lines)>=1 else 0
    elif case_id==11:
        try:
            obj=json.loads(text)
            return 2 if set(obj.keys())=={'city','temp_c','ok'} and obj['ok'] is True and isinstance(obj['temp_c'], int) else 1
        except:
            return 0
    elif case_id==13:
        return 2 if text=='3' else 0
    elif case_id==22:
        return 2 if text=='alpha\nbeta' else 1 if 'alpha' in text and 'beta' in text else 0
    elif case_id==29:
        cjk=count_cjk(text)
        return 2 if 14<=cjk<=18 and '信息' not in text and all(p not in text for p in '，。！？,.!?') else 1 if cjk>=10 else 0
    return 0

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--provider', required=True)
    parser.add_argument('--model', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--delay', type=float, default=0.5)
    args = parser.parse_args()

    p = cfg['models']['providers'][args.provider]
    url = p['baseUrl'].rstrip('/') + '/chat/completions'
    headers = {
      'Authorization': f"Bearer {p['apiKey']}",
      'Content-Type': 'application/json',
      'User-Agent': 'openclaw/model-fingerprint-lite'
    }

    def ask(prompt):
        payload={
          'model': args.model,
          'messages':[{'role':'user','content':prompt}],
          'temperature':0
        }
        req=urllib.request.Request(url, data=json.dumps(payload).encode(), headers=headers)
        with urllib.request.urlopen(req, timeout=90) as r:
          return json.loads(r.read().decode('utf-8','ignore'))

    results=[]
    for case_id, name, prompt in TESTS:
        try:
            res=ask(prompt)
            text=res['choices'][0]['message']['content']
            score=score_case(case_id, text)
            results.append({'id':case_id,'name':name,'score':score,'model':res.get('model'),'output':text,'usage':res.get('usage',{})})
        except Exception as e:
            results.append({'id':case_id,'name':name,'score':-1,'error':repr(e)})
        time.sleep(args.delay)

    summary={'provider': args.provider, 'model': args.model, 'totalScore': sum(max(0,r['score']) for r in results), 'maxScore': len(TESTS)*2, 'results': results}
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2))
    print(json.dumps({'out': str(out_path), 'totalScore': summary['totalScore'], 'maxScore': summary['maxScore']}, ensure_ascii=False))

if __name__ == '__main__':
    main()
