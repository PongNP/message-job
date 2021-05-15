import { Injectable } from '@nestjs/common';
import * as mimemessage from 'mimemessage';
import * as aws from 'aws-sdk';

@Injectable()
export class MailService {

  async send (to: string[], from: string, cc:string[], subject: string, html: string, attachments?: any[]): Promise<any> {
    const ses = new aws.SES({
      region: process.env.AWS_DEFAULT_REGION,
    });

    const s3 = new aws.S3({
      region: 'ap-southeast-1',
    });

    if(Array.isArray(attachments)){
      if(attachments.length > 0){
        let mailContent = mimemessage.factory({contentType: 'multipart/mixed',body: []});
        mailContent.header('From', from);
        mailContent.header('To', to.join());
        if(cc){
          mailContent.header('Cc', cc.join());
        }
        mailContent.header('Subject', subject);

        let alternateEntity = mimemessage.factory({
          contentType: 'multipart/alternate',
          body: []
        });

        let htmlEntity = mimemessage.factory({
          contentType: 'text/html;charset=utf-8',
          body: html
        });
      
        alternateEntity.body.push(htmlEntity);
        mailContent.body.push(alternateEntity);
        for( let i = 0 ; i < attachments.length ; i++){
          if(
            ("body" in attachments[i]) &&
            ("mimetype" in attachments[i]) &&
            ("originalname" in attachments[i])
          ){
            //----READ File directly----//
            var attachmentEntity = mimemessage.factory({
                contentType: attachments[i].mimetype,
                contentTransferEncoding: 'base64',
                body: attachments[i].body,

            });
            attachmentEntity.header('Content-Disposition', 'attachment ;filename="' + attachments[i].originalname + '"');
            if("content_id" in attachments[i]){
              attachmentEntity.header('Content-ID', `<${attachments[i].content_id}>`);
            }
            mailContent.body.push(attachmentEntity);
          } else if (
            ("bucket" in attachments[i]) &&
            ("key" in attachments[i])
          ){
            
            //----READ file From S3 URL----//
            let params = {
              Bucket: attachments[i].bucket,
              Key: attachments[i].key,
            };

            let err,data = await s3.getObject(params).promise();
            if(err){
              throw err
            }

            var attachmentEntity = mimemessage.factory({
              contentType: data.ContentType,
              contentTransferEncoding: 'base64',
              body: data.Body.toString('base64')
            });
            console.log(data.ContentDisposition)
            attachmentEntity.header('Content-Disposition', 'attachment ;filename="' + attachments[i].filename + '"');
            mailContent.body.push(attachmentEntity);

          }
        }
        
        let err,data = await ses.sendRawEmail({ RawMessage: {Data: mailContent.toString()}}).promise()
        if(err) {
          throw err
        } else {
          return data
        }
      }
    }
    
    var params = { 
      Source: from, 
      Destination: { 
        ToAddresses: to,
        CcAddresses: cc
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'utf-8'
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'utf-8'
          }
        }
      }
    };
    
    let err,data = await ses.sendEmail(params).promise()
    if(err) {
      throw err
    } else {
      return data
    }
  }
}
