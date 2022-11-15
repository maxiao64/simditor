(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('simple-uploader', ["jquery",
            "simple-module"], function ($, SimpleModule) {
            return (root.returnExportsGlobal = factory($, SimpleModule));
        });
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory(require("jquery"),
            require("simple-module"));
    } else {
        root.simple = root.simple || {};
        root.simple['uploader'] = factory(jQuery,
            SimpleModule);
    }
  }(this, function ($, SimpleModule) {
    var Uploader, uploader,
        __hasProp = {}.hasOwnProperty,
        __extends = function (child, parent) {
            for (var key in parent) {
                if (__hasProp.call(parent, key)) child[key] = parent[key];
            }
            function ctor() {
                this.constructor = child;
            }
  
            ctor.prototype = parent.prototype;
            child.prototype = new ctor();
            child.__super__ = parent.prototype;
            return child;
        };
    Uploader = (function (_super) {
        __extends(Uploader, _super);
  
        function Uploader() {
            return Uploader.__super__.constructor.apply(this, arguments);
        }
  
        Uploader.count = 0;
        Uploader.prototype.opts = {
            url: '',
            params: {},
            fileKey: 'file',
            connectionCount: 3,
            qnDomain: null,//图片下载的域名
            qnTokenUrl: null,//获取token的url
            qnUpHost: null,//获取token的url
            fileSize:10485760
        };
        Uploader.prototype._init = function () {
            this.files = [];
            this.queue = [];
            this.id = ++Uploader.count;
            this.on('uploadcomplete', (function (_this) {
                return function (e, file) {
                    _this.files.splice($.inArray(file, _this.files), 1);
                    if (_this.queue.length > 0 && _this.files.length < _this.opts.connectionCount) {
                        return _this.upload(_this.queue.shift());
                    } else {
                        return _this.uploading = false;
                    }
                };
            })(this));
            return $(window).on('beforeunload.uploader-' + this.id, (function (_this) {
                return function (e) {
                    if (!_this.uploading) {
                        return;
                    }
                    e.originalEvent.returnValue = _this._t('leaveConfirm');
                    return _this._t('leaveConfirm');
                };
            })(this));
        };
        Uploader.prototype.generateId = (function () {
            var id;
            id = 0;
            return function () {
                return id += 1;
            };
        })();
        //增加获取token的请求
        Uploader.prototype.getToken = function () {
            var me = this;
            $.ajax({
                async: false,
                url: this.opts.qnTokenUrl,
                type: "get",
                dataType: "json",
                success: function (data) {
                    me.opts.qnDomain = data.domain;//从服务器获得域名
                    me.opts.params['token'] = data.uptoken;//从服务器获取token，根据服务器修改数据属性
                    me.opts.qnUpHost = data.uphost;//从服务器获取token，根据服务器修改数据属性
                }
            })
        };
        Uploader.prototype.upload = function (file, opts) {
            var f, key, _i, _len;
            if (opts == null) {
                opts = {};
            }
            if (file == null) {
                return;
            }
  
            if ($.isArray(file) || file instanceof FileList) {
                for (_i = 0, _len = file.length; _i < _len; _i++) {
                    f = file[_i];
                    if(f.size>this.opts.fileSize){
                        alert("文件大小不能超过："+(this.opts.fileSize/1048576)+"MB");
                    }else{
                        this.upload(f, opts);
                    }
                }
            } else if ($(file).is('input:file')) {
               // var file0 = $(file)[0]
                key = $(file).attr('name');
                if (key) {
                    opts.fileKey = key;
                }
                this.upload($.makeArray($(file)[0].files), opts);
            } else if (!file.id || !file.obj) {
                file = this.getFile(file);
            }
            if (!(file && file.obj)) {
                return;
            }
            $.extend(file, opts);
            if (this.files.length >= this.opts.connectionCount) {
                this.queue.push(file);
                return;
            }
            if (this.triggerHandler('beforeupload', [file]) === false) {
                return;
            }
            this.getToken();//从服务器获取token
            this.files.push(file);
            this._xhrUpload(file);
            return this.uploading = true;
        };
        Uploader.prototype.getFile = function (fileObj) {
            var name, _ref, _ref1;
            if (fileObj instanceof window.File || fileObj instanceof window.Blob) {
                name = (_ref = fileObj.fileName) != null ? _ref : fileObj.name;
            } else {
                return null;
            }
            return {
                id: this.generateId(),
                url: this.opts.url,
                params: this.opts.params,
                fileKey: this.opts.fileKey,
                name: name,
                size: (_ref1 = fileObj.fileSize) != null ? _ref1 : fileObj.size,
                ext: name ? name.split('.').pop().toLowerCase() : '',
                obj: fileObj
            };
        };
        Uploader.prototype._xhrUpload = function (file) {
            var formData, k, v, _ref;
            var me = this;
            formData = new FormData();
            formData.append("file", file.obj);
            formData.append("key", file.name);
            formData.append("token", me.opts.params['token']);
            if (file.params) {
                _ref = file.params;
                for (k in _ref) {
                    v = _ref[k];
                    formData.append(k, v);
                }
            }
            return file.xhr = $.ajax({
                url: me.opts.qnUpHost,
                data: formData,
                processData: false,
                contentType: false,
                type: 'POST',
                xhr: function () {
                    var req;
                    req = $.ajaxSettings.xhr();
                    if (req) {
                        req.upload.onprogress = (function (_this) {
                            return function (e) {
                                return _this.progress(e);
                            };
                        })(this);
                    }
                    return req;
                },
                progress: (function (_this) {
                    return function (e) {
                        if (!e.lengthComputable) {
                            return;
                        }
                        return _this.trigger('uploadprogress', [file, e.loaded, e.total]);
                    };
                })(this),
                error: (function (_this) {
                    return function (xhr, status, err) {
                        return _this.trigger('uploaderror', [file, xhr, status]);
                    };
                })(this),
                success: (function (_this) {
                    return function (result) {
                        //使用七牛的key和domain构造新连接
                        var newresult = JSON.parse("{\"file_path\":\"" + me.opts.qnDomain + "/" +result.key + "\"}");
                        _this.trigger('uploadprogress', [file, file.size, file.size]);
                        _this.trigger('uploadsuccess', [file, newresult]);
                        return $(document).trigger('uploadsuccess', [file, newresult, _this]);
                    };
                })(this),
                complete: (function (_this) {
                    return function (xhr, status) {
                        return _this.trigger('uploadcomplete', [file, xhr.responseText]);
                    };
                })(this)
            });
        };
        Uploader.prototype.cancel = function (file) {
            var f, _i, _len, _ref;
            if (!file.id) {
                _ref = this.files;
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    f = _ref[_i];
                    if (f.id === file * 1) {
                        file = f;
                        break;
                    }
                }
            }
            this.trigger('uploadcancel', [file]);
            if (file.xhr) {
                file.xhr.abort();
            }
            return file.xhr = null;
        };
        Uploader.prototype.readImageFile = function (fileObj, callback) {
            var fileReader, img;
            if (!$.isFunction(callback)) {
                return;
            }
            img = new Image();
            img.onload = function () {
                return callback(img);
            };
            img.onerror = function () {
                return callback();
            };
            if (window.FileReader && FileReader.prototype.readAsDataURL && /^image/.test(fileObj.type)) {
                fileReader = new FileReader();
                fileReader.onload = function (e) {
                    return img.src = e.target.result;
                };
                return fileReader.readAsDataURL(fileObj);
            } else {
                return callback();
            }
        };
        Uploader.prototype.destroy = function () {
            var file, _i, _len, _ref;
            this.queue.length = 0;
            _ref = this.files;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                file = _ref[_i];
                this.cancel(file);
            }
            $(window).off('.uploader-' + this.id);
            return $(document).off('.uploader-' + this.id);
        };
        Uploader.locale = 'zh-CN';
        return Uploader;
  
    })(SimpleModule);
    uploader = function (opts) {
        return new Uploader(opts);
    };
    return uploader;
  }));
  function EditorUtil(){}
  
  EditorUtil.prototype.getKeysFromSrc = function(htmlCode){
    var patt = /<img[^>]+src=['"]([^'"]+)['"]+/g;
    var result = [], temp;
    while( (temp= patt.exec(htmlCode)) != null ) {
        result.push(temp[1].substr(temp[1].lastIndexOf("/")+1));
    }
    return result.join(",");
  }
  