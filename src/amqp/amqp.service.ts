import { Injectable } from '@nestjs/common';
import { Timeout, Interval } from '@nestjs/schedule';
import * as amqp from 'amqplib';

import { SmsService } from 'src/sms/sms.service';
import { MailService } from '../mail/mail.service';
import { MessageService } from 'src/message/message.service';

let global_channel= null
let fail_count = 0;

@Injectable()
export class AmqpService {
    
    constructor(
        private mailService:MailService,
        private smsService:SmsService,
        private messageService:MessageService
    ){}

    @Timeout(1000)
    init_amqp(){
        console.log("Server starting...");
        console.log(`HOSTNAME : ${process.env.AMQP_HOST}`)
        console.log(`PORT : ${process.env.AMQP_PORT}`)
        console.log(`VHOST : ${process.env.AMQP_VHOST}`)
        console.log(`EXCHANGE : ${process.env.AMQP_EXCHANGENAME}`)
        console.log(`QUEUE : ${process.env.AMQP_QUEUE_NAME}`)
        console.log(`ROUTING KEY : ${process.env.AMQP_ROUTINGKEY}`)
        amqp.connect({
            hostname: process.env.AMQP_HOST,
            port: process.env.AMQP_PORT,
            vhost: process.env.AMQP_VHOST,
            username: process.env.AMQP_USERNAME,
            password: process.env.AMQP_PASSWORD,
            protocol: process.env.AMQP_PROTOCOL,
        }).then((connection) => {

            connection.on('error', () => {
                console.log(' [*] Connection error, retrying...');
                try {
                    connection.close();
                }
                catch (e){
                    console.log(e);
                }
                setTimeout(() => {
                    this.init_amqp();
                }, 3000);
            });
            
            connection.on('closed', () => {
                console.log(' [*] Connection unexpected closed, reconnecting...');
                try {
                    connection.close();
                }
                catch (e){
                    console.log(e);
                }
                setTimeout(() => {
                    this.init_amqp();
                }, 3000);
            })
            
            return connection.createChannel().then( (channel) => {

                channel.assertQueue(process.env.AMQP_QUEUE_NAME, { durable: true });
                channel.prefetch(parseInt(process.env.AMQP_PREFETCH));
                global_channel = channel
                console.log(' [*] Waiting for Sending Email & SMS.');

                return channel.consume(process.env.AMQP_QUEUENAME, async (msg) => {
                    let data = msg.content.toString()
                    let obj_data, obj_message, transaction_id
                    console.log(' [*] receieved message', data);
                    try {
                        obj_data = JSON.parse(data); 
                    } catch (error) {
                        console.error(` [*] Error: Malformed JSON`);
                        return channel.nack(msg, false ,false);
                    }

                    try {
                        if("transaction_id" in obj_data){
                            transaction_id = obj_data.transaction_id
                            obj_message = await this.messageService.findOneByTransactionId(obj_data.transaction_id)
                        }
                    } catch (error) {
                        console.error(` [*] Error: ${error}`);
                        return channel.nack(msg, false ,false);
                    }

                    try{
                        let data_return
                        switch (obj_data.type) {
                            case 'EMAIL':
                                data_return = await this.mailService.send(obj_data.data.receiver, obj_data.data.sender, obj_data.data.cc, obj_data.data.subject, obj_data.data.body, obj_data.data.attachments)
                                if(obj_message){
                                    this.messageService.update_status(obj_message.id,{
                                        response : JSON.stringify(data_return),
                                        is_success : true
                                    })
                                }
                                console.log(` [${transaction_id || "*"}] : Email sent! (Message ID=${data_return.MessageId})`);
                                break;
                            case 'SMS':
                                data_return = await this.smsService.send(obj_data.data.receiver, obj_data.data.sender, obj_data.data.message)
                                console.log(` [${transaction_id || "*"}] : SMS sent! (Message ID=${data_return.data.message_id})`)
                                break;
                            default:
                                console.error(` [${transaction_id || "*"}] Error: Unknown Message Type'`);
                                throw new Error("")
                        }
                        if(obj_message){
                            this.messageService.update_status(obj_message.id,{
                                response : JSON.stringify(data_return.data),
                                is_success : true
                            })
                        }
                        return channel.ack(msg);
                    } catch (error) {
                        if(error != ""){
                            console.error(` [${transaction_id || "*"}] Error: ${JSON.stringify(error)}`);
                        }
                        if(obj_message){
                            this.messageService.update_status(obj_message.id,{
                                response : JSON.stringify(error),
                                is_success : false
                            })
                        }
                        return channel.nack(msg, false ,false);
                    }
                }, { noAck: false });
            })
        }).catch((err) => {
            console.log(err.message);
            console.log(' [*] Cound not connect to RabbitMQ, retrying...');
            setTimeout(() => {
                this.init_amqp();
            }, 3000)
        });
    }

    @Interval(5000)
    async handleInterval() {
        if (global_channel != null)
        {
            try
            {
                await global_channel.checkQueue(process.env.AMQP_QUEUE_NAME);
                await global_channel.checkExchange(process.env.AMQP_EXCHANGENAME);
                fail_count = 0;
            } catch (e) {
                console.log("AMQP check fail...");
                console.log(e);
                fail_count++;
                if (fail_count == 3)
                {
                    console.log("AMQP fail terminated")
                    process.exit();
                }
            }
        }
    }
}