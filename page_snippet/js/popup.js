$(function() {
    var pageSnippet = {
        INVALID_STR: '%%%'
    };

    /**
    /* 初期化処理
    /* @param shouldReloadUrlPrefix URLプレフィクスを更新するかどうかのフラグ
    **/
    pageSnippet.init = function(shouldReloadUrlPrefix) {
        // 現在のタブ情報取得
        var queryInfo = {
            active: true,
            lastFocusedWindow: true
        };
        chrome.tabs.query(queryInfo, function(tab) {
            if (tab.length === 0) {
                return;
            }
            var currentUrl = tab[0].url;
            if (typeof currentUrl === 'undefined' || currentUrl === null || currentUrl === '') {
                return;
            }
            if (shouldReloadUrlPrefix) {
                $('#url-prefix').val(currentUrl);
            }
            $('#alias').val('');
            // 登録されているURLデータ取得
            var defaults = {
                snippets: ''
            };
            chrome.storage.sync.get(defaults, function(snippetsInfo) {
                var dataJson = snippetsInfo.snippets;
                if (dataJson === '') {
                    return;
                }
                var data = JSON.parse(dataJson);
                // こんなんを取得できる
                // data = [
                //     url1: ["alias%sni1", "alias%sni2"],
                //     url2: ["alias%sni3", "alias%sni4"]
                // ];

                // URL検証
                for (var key in data) {
                    if (!currentUrl.startsWith(key)) {
                        continue;
                    }

                    // マッチしたらボタンを作成していく
                    var snippets = data[key];
                    var index = 0;
                    for (var key2 in snippets) {
                        var info = snippets[key2].split(pageSnippet.INVALID_STR);
                        pageSnippet.appendRow(info[0], info[1], key, index);
                        index++;
                    }
                }
            });
        });
    };

    /**
    /* スニペット追加処理
    /* @param alias スニペットのエイリアス
    /* @param snippet スニペット
    /* @param url URL
    /* @param index インデックス
    **/
    pageSnippet.appendRow = function(alias, snippet, url, index) {
        var clone = $('#dummy-snippet-area').children().clone();
        var label = clone.find('label');
        label.text(alias);
        label.attr('title', snippet);
        clone.find('.snippet-url').val(url);
        clone.find('.snippet-index').val(index);
        $('#snippets-area').append(clone);
    }

    /**
    /* スニペット保存処理
    /* @param snippet スニペット
    /* @param url URL
    /* @param index インデックス
    **/
    pageSnippet.save = function(saveData) {
        // 登録されているURLデータ取得
        var defaults = {
            snippets: '',
        };
        chrome.storage.sync.get(defaults, function(snippetsInfo) {
            var dataJson = snippetsInfo.snippets;
            var newSnippetIndex = 0;
            if (dataJson === '') {
                // この拡張の登録データが存在しなかった場合
                var data = {};
                data[saveData.url] = [saveData.alias + pageSnippet.INVALID_STR + saveData.snippet];
            } else {
                var data = JSON.parse(dataJson);
                // マッチしたURLキーに対して更新を行う
                var existFlag = false;
                for (var key in data) {
                    if (saveData.url === key) {
                        newSnippetIndex = data[key].length;
                        data[key].push(saveData.alias + pageSnippet.INVALID_STR + saveData.snippet);
                        existFlag = true;
                        break;
                    }
                }
                // マッチしたURLがなかった場合は新規追加
                if (!existFlag) {
                    data[saveData.url] = [saveData.alias + pageSnippet.INVALID_STR + saveData.snippet];
                }
            }
            var updateInfo = {
                snippets: JSON.stringify(data)
            };
            chrome.storage.sync.set(updateInfo);

            // 行追加
            pageSnippet.appendRow(saveData.alias, saveData.snippet, saveData.url, newSnippetIndex);
        });
    };

    // 追加
    $('#add-new-snippet').on('click', function() {
        var data = {
            url: $('#url-prefix').val(),
            snippet: $('#new-snippet').val(),
            alias: $('#alias').val()
        }
        if (data.alias === '') {
            data.alias = data.snippet;
        }

        // バリデーション
        // 空文字はダメ
        if (data.snippet === '' || data.url === '') {
            return;
        }
        // 「%」は入力不可
        if (data.snippet.indexOf(pageSnippet.INVALID_STR) >= 0) {
            alert('Can not input \'' + pageSnippet.INVALID_STR + '\'');
            return;
        }

        pageSnippet.save(data);

        $('#new-snippet').val('');
    });

    // 削除
    $(document).on('click', '.del-snippet', function() {
        // 対象のURL,テキスト取得
        var copySnippet = $(this).prev('.copy-snippet');
        var url = copySnippet.find('.snippet-url').val();
        var alias = copySnippet.find('label').text();
        var text = copySnippet.find('label').attr('title');
        var index = copySnippet.find('.snippet-index').val();

        // 登録されているURLデータ取得
        var defaults = {
            snippets: '',
        };
        chrome.storage.sync.get(defaults, function(snippetsInfo) {

            var dataJson = snippetsInfo.snippets;
            if (dataJson === '') {
                // この拡張の登録データが存在しなかった場合 ※複数ブラウザ考慮
                return;
            }
            var data = JSON.parse(dataJson);
            if (data[url][index] !== alias + pageSnippet.INVALID_STR + text) {
                //※複数ブラウザ考慮
                return;
            }
            data[url].splice(index, 1);
            // 更新
            var updateInfo = {
                snippets: JSON.stringify(data)
            };
            chrome.storage.sync.set(updateInfo);
            // リロード
            $('#reload-snippets').trigger('click');
        });
    });

    // コピー
    $(document).on('click', '.copy-snippet', function() {
        debugger;
        // コピー内容のテキスト取得
        var text = $(this).find('label').attr('title');
        // コピーボタン（非表示）にセット
        $('#page-snippet-copy-button').attr('data-clipboard-text', text);
        // コピー実行
        $('#page-snippet-copy-button').trigger('click');
    });

    // リロード
    $('#reload-snippets').on('click', function() {
        $('#snippets-area').empty();
        pageSnippet.init(false);
    });

    // 初期処理
    pageSnippet.init(true);
    // コピーボタンをClipboardとしてインスタンス化
    new Clipboard('#page-snippet-copy-button');
});
