$(function() {

    // 登録されているデータ取得
    var defaults = {
        snippets: '',
    };
    chrome.storage.sync.get(defaults, function(snippetsInfo) {
        var dataJson = snippetsInfo.snippets;
        if (dataJson === '') {
            return;
        }
        var data = JSON.parse(dataJson);
        // こんなんを取得できる
        // data = [
        //     url1: ["sni1", "sni2"],
        //     url2: ["sni3", "sni4"]
        // ];

        // URLごとのループ
        for (var key in data) {
            var snippets = data[key];
            var index = 0;
            // スニペットごとのループ
            for (var key2 in snippets) {
                var clone = $('#dummy-snippet-area').children().clone();
                if (index === 0) {
                    clone.find('.snippet-url').text(key);
                }
                clone.find('.snippet').val(snippets[key2]);
                $('#snippet-area').append(clone);
                index++;
            }
        }
    });

});
