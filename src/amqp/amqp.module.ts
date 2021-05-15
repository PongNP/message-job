import { HttpModule } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MailService } from 'src/mail/mail.service';
import { Message } from 'src/message/message.model';
import { MessageService } from 'src/message/message.service';
import { SmsService } from 'src/sms/sms.service';
import { AmqpService } from './amqp.service';

@Module({
  imports:[HttpModule,
    SequelizeModule.forFeature([Message])
  ],
  providers: [AmqpService, MailService, SmsService, MessageService]
})
export class AmqpModule {}
