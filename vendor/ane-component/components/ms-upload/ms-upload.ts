import * as avalon from 'avalon2';
import controlComponent from '../ms-form/ms-control';
import { emitToFormItem } from '../ms-form/utils';
import './ms-upload.css';
import './ms-upload-list';
import Uploader from 'up-loader';

/**
 * 文件上传组件
 * @prop value 组件值(inherit)
 * @prop col 字段路径(inherit)
 * 
 * @example
 * ``` html
 * <ms-upload :widget="{value:@record.attachment,col:'attachment',$rules:{required:true,type:'array'}}">
 *      <i class="fa fa-upload"></i>选择附件
 * </ms-upload>
 * ```
 */
controlComponent.extend({
    displayName: 'ms-upload',
    template: __inline('./ms-upload.html'),
    soleSlot: 'trigger',
    defaults: {
        helpId: '',
        trigger: '',
        value: [],
        fileList: [],
        action: '',
        listType: 'text-list',
        $uploader: null,
        handleRemove(file) {
            this.fileList.removeAll(f => f.uid === file.uid);
            this.value.remove(file.url);
            this.handleChange({
                target: { value: this.value.$model || this.value },
                type: 'file-upload'
            });
        },
        onInit(event) {
            emitToFormItem(this);
            this.helpId = this.$id;
            this.value.map((url, i) => {
                this.fileList.push({
                    uid: -(i + 1),
                    name: url.replace(/.*\/([^\/]+)\/?/, '$1'),
                    url: url,
                    status: 'done',
                    progress: 0
                });
            });
        },
        onReady(event) {
            this.$uploader = Uploader.init({
                url: this.action,
                fileInput: event.target.getElementsByTagName('input').file,
                onSelect: (files, allFiles) => {
                    allFiles.map(file => {
                        if (this.fileList.every(f => f.uid !== file.index)) {
                            this.fileList.push({
                                uid: file.index,
                                name: file.name,
                                status: 'uploading',
                                progress: 0
                            });
                        } else {
                            updateFileObj(this.fileList, file.index, f => {
                                f.status = 'uploading';
                                f.progress = 0;
                            });
                        }
                    });
                    this.$uploader.upload();
                },
                onProgress: (file, loaded, total) => {
                    updateFileObj(this.fileList, file.index, f => f.progress = (loaded / total * 100).toFixed());
                },
                onSuccess: (file, response) => {
                    updateFileObj(this.fileList, file.index, f => {
                        f.status = 'done';
                        f.progress = 100;
                        f.url = response.url;
                    });
                    this.value.push(response.url);
                },
                onFailure: (file, err) => {
                    updateFileObj(this.fileList, file.index, f => f.status = 'error')
                    throw err;
                },
                onComplete: () => {
                    this.handleChange({
                        target: { value: this.value.$model || this.value },
                        type: 'file-upload'
                    });
                }
            });
        },
        onDispose(event) {
        }
    }
});

function updateFileObj(fileList, uid, callback) {
    fileList.forEach(f => {
        if (f.uid === uid) {
            callback(f);
            return false;
        }
    });
}