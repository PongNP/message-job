import { HttpModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailService } from './mail/mail.service';
import { AmqpModule } from './amqp/amqp.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from './mail/mail.module';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { SmsModule } from './sms/sms.module';
import { MessageModule } from './message/message.module';
import { Message } from './message/message.model';
import { SmsService } from './sms/sms.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    AmqpModule,
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadModels: true,
      logging: false
    }),
    ScheduleModule.forRoot(),
    MailModule,
    SmsModule,
    MessageModule,
    SequelizeModule.forFeature([Message])
  ],
  controllers: [AppController],
  providers: [AppService, MailService, SmsService]
})
export class AppModule {}
