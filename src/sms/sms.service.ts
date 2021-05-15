import { HttpService, Injectable } from '@nestjs/common';

@Injectable()
export class SmsService {

    constructor(
        private httpService: HttpService
    ){
        
    }

    async check(message_id: string): Promise<any> {
        try {
            let path = `${process.env.SMS_ENDPOINT_URL}?username=${process.env.SMS_USERNAME}&password=${process.env.SMS_PASSWORD}&messageId=${message_id}&command=query`
            let data = await this.httpService.get(encodeURI(path)).toPromise();
            return data.data
        } catch (error) {
            throw error
        }
    }
    
    async send(to: string, from: string, message: string): Promise<any> {
        try {
            let phone = `66${parseInt(to)}`;
            let path = `${process.env.SMS_ENDPOINT_URL}?username=${process.env.SMS_USERNAME}&password=${process.env.SMS_PASSWORD}&ani=${from}&dnis=${phone}&message=${message}&command=submit&longMessageMode=payload`
            let data = await this.httpService.get(encodeURI(path)).toPromise();
            return data
        } catch (error) {
            throw error
        }
    }
}