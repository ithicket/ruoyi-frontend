
const useTranslateStore = defineStore(
    'translate',
    {
        state: () => ({
            sett: {
                // 发送
                src: {
                    type: true,
                    src: ' ',
                    dst: 'en'
                },
                // 接收
                dst: {
                    type: true,
                    src: ' ',
                    dst: 'zh-Hans'
                }
            },
            token: null,
            translate_user_setting: true,
            Language: {
                AUTO: ' ',
                ZH_CN: 'zh-Hans',
                ZH_TW: 'zh-Hant',
                YUE: 'yue',
                EN: 'en',
                JA: 'ja',
                KO: 'ko',
                FR: 'fr',
                ES: 'es',
                RU: 'ru',
                DE: 'de',
                IT: 'it',
                TR: 'tr',
                PT_PT: 'pt-pt',
                PT_BR: 'pt',
                VI: 'vi',
                ID: 'id',
                TH: 'th',
                MS: 'ms',
                AR: 'ar',
                HI: 'hi',
                MN_CY: 'mn-Cyrl',
                MN_MO: 'mn-Mong',
                KM: 'km',
                NB_NO: 'nb',
                FA: 'fa',
                SV: 'sv',
                PL: 'pl',
                NL: 'nl',
                UK: 'uk',
                HE: 'he'
            },
            Language_t: {
                AUTO: '自动检测',
                ZH_CN: '简体中文',
                ZH_TW: '繁体中文',
                YUE: '越南',
                EN: '英语',
                JA: '日语',
                KO: '韩语',
                FR: '法语',
                ES: '西班牙语',
                RU: '俄语',
                DE: '德语',
                IT: '意大利语',
                TR: '土耳其语',
                PT_PT: '欧洲葡萄牙语',
                PT_BR: '巴西葡萄牙语',
                VI: '越南语',
                ID: '印度尼西亚语',
                TH: '泰语',
                MS: '马来语',
                AR: '阿拉伯语',
                HI: '印地语',
                MN_CY: '蒙古语（西里尔字母）',
                MN_MO: '蒙古语（传统蒙古文）',
                KM: '高棉语',
                NB_NO: '挪威语（书面挪威语）',
                FA: '波斯语',
                SV: '瑞典语',
                PL: '波兰语',
                NL: '荷兰语',
                UK: '乌克兰语',
                HE: '希伯来语',
            },
        }),
        actions: {
            async fetchTranslateToken() {
                const token_url = 'https://edge.microsoft.com/translate/auth';
                const token = await fetch(token_url, {
                    method: 'GET',
                    headers: {
                        'User-Agent':
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
                    },
                    responseType: 2,
                });
                this.token = await token.text();
            },
            async totranslate(text, from, to) {
                
                if (this.token && text) {
                    let tokenText = this.token;
                    // console.log(token)
                    const apiVersion = '3.0'; // API版本
                    const url = `https://api-edge.cognitive.microsofttranslator.com/translate?api-version=${apiVersion}&from=${from}&to=${to}`;
                    const body = JSON.stringify([{ Text: text }]);
                    let res = await fetch(url, {
                        method: 'POST',
                        headers: {
                            accept: '*/*',
                            'accept-language': 'zh-TW,zh;q=0.9,ja;q=0.8,zh-CN;q=0.7,en-US;q=0.6,en;q=0.5',
                            authorization: 'Bearer ' + tokenText,
                            'cache-control': 'no-cache',
                            'content-type': 'application/json',
                            pragma: 'no-cache',
                            'sec-ch-ua': '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
                            'sec-ch-ua-mobile': '?0',
                            'sec-ch-ua-platform': '"Windows"',
                            'sec-fetch-dest': 'empty',
                            'sec-fetch-mode': 'cors',
                            'sec-fetch-site': 'cross-site',
                            Referer: 'https://appsumo.com/',
                            'Referrer-Policy': 'strict-origin-when-cross-origin',
                            'User-Agent':
                                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.42',
                        },
                        query: {
                            from: from,
                            to: to,
                            'api-version': '3.0',
                            includeSentenceLength: 'true',
                        },
                        body: body,
                        // dispatcher:proxyAgent,  // 这里加入代理
                    });
                    
                    if (res.ok) {
                        let responseBody = await res.json(); // 读取响应体为文本
                        if (responseBody[0].translations) {
                            return responseBody[0].translations[0].text.trim();
                        }
                    } else {
                        console.error(`Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`);
                    }
                } else {
                    return '';
                }
            },
            async translate(msg, type = 'src') {
                const sett = this.sett;
                // console.log("翻译配置", sett);
                
                if (type == 'src')
                    return await this.totranslate(msg, sett.src.src, sett.src.dst);
                if (type == 'dst')
                    return await this.totranslate(msg, sett.dst.src, sett.dst.dst);
            },
            updateSettings(sett) {
                this.sett = sett;
            },
            updateUserSetting(bol) {
                this.translate_user_setting = bol==undefined?true:bol;
            },
        },
        // 添加持久化配置
        persist: {
            key: 'translate-settings', // 自定义存储键名
            storage: localStorage,      // 使用 localStorage
            pick: ['sett', 'translate_user_setting'] // 只持久化这两个字段
        }
    })

export default useTranslateStore
