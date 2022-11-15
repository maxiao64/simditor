# Simditor-upload-qiniu extension for laravel-admin


This is a `laravel-admin` extension that integrates [Simditor](https://github.com/mycolorway/simditor) for qiniu upload image function into the `laravel-admin` form.
## Screenshot

<img alt="simditor" src="https://raw.githubusercontent.com/maxiao64/simditor/master/review.jpg">

## Installation

```bash
composer require MaXiao/simditor

php artisan vendor:publish --tag=laravel-admin-simditor
```

## Configuration

In the `extensions` section of the `config/admin.php` file, add some configuration that belongs to this extension.
```php

'extensions' => [
    'simditor' => [
        // Set to false if you want to disable this extension
        'enable' => true,
        // Editor configuration
        'config' => [
             'upload' => [
                    'qnTokenUrl' => '/' . env('ADMIN_ROUTE_PREFIX') . '/api/getQnToken', // 获取七牛配置项的接口
                    'fileKey' => 'upload_file',
                    'connectionCount' => 3,
                    'leaveConfirm' => 'Uploading is in progress, are you sure to leave this page?'
                ],
            'tabIndent' => true,
            'toolbar' => ['title', 'bold', 'italic', 'underline', 'strikethrough', 'fontScale', 'color', '|', 'ol', 'ul', 'blockquote', 'code', 'table', '|', 'link', 'image', 'hr', '|', 'indent', 'outdent', 'alignment'],
            'toolbarFloat' => true,
            'toolbarFloatOffset' => 0,
            'toolbarHidden' => false,
            'pasteImage' => true,
            'cleanPaste' => false,
        ]
    ]
]
```

qnTokenUrl 接口的格式
请求方式 GET,
返回格式
```json
{
	"uphost": "https://up-z2.qiniup.com", // 图片上传的地址
	"domain": "http://image.mmmx17.cn", // 七牛的域名
	"uptoken": "xxxxxxxxx" // 上传图片需要的token
}
```

接口示例：
```php
// in controller 
public function getQnToken()
    {
        $qnConfig = new Config();
        $qnConfig->useHTTPS = env('IS_HTTPS_APP');
        list($uphost, $error) = $qnConfig->getUpHostV2(config('filesystems.disks.qiniu.access_key') , config('filesystems.disks.qiniu.bucket'));
        if($error) {
            return [];
        }
        return [
            'uphost' => $uphost,
            'domain' => config('filesystem.disks.qiniu.domains.default'),
            'uptoken' => Storage::disk('qiniu')->getAdapter()->uploadToken()
        ];
    }
    
// in config/filesystems.php
...
'qiniu' => 
    [
        'driver'  => 'qiniu',
        'domains' => [
            'default'   => 'http://image.mmmx17.cn', //你的七牛域名
            'https'     => 'image.mmmx17.cn',         //你的HTTPS域名
            'custom'    => 'static.abc.com',                //Useless 没啥用，请直接使用上面的 default 项
            ],
        'access_key'=> env('QINIU_AK_KEY'),  //AccessKey
        'secret_key'=> env('QINIU_SK_KEY'),  //SecretKey
        'bucket'    => 'mmmx17cn',  //Bucket名字
        'notify_url'=> '',  //持久化处理回调地址
        'access'    => 'public',  //空间访问控制 public 或 private
        'hotlink_prevention_key' => null, // CDN 时间戳防盗链的 key。 设置为 null 则不启用本功能。
    ],
...
```

The configuration of the editor can be found in [Simditor Documentation](https://simditor.tower.im/docs/doc-usage.html).

## Usage

Use it in the form form:
```php
$form->simditor('content');
```

License
------------
Licensed under [The MIT License (MIT)](LICENSE).
