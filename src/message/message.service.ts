import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UpdateDto } from './dto/message.dto';
import { Message } from './message.model';

@Injectable()
export class MessageService {
    constructor(
        @InjectModel(Message) private messageModel: typeof Message
    ){

    }

    async findAll() {
        return await this.messageModel.findAll();
    }

    async findOne(id: string) {
        return await this.messageModel.findByPk(id);
    }

    async findOneByTransactionId(transaction_id: string) {
        return await this.messageModel.findOne({where : {transaction_id : transaction_id}});
    }

    async update_status(id: string, updateDto: UpdateDto) {
        var data = await this.findOne(id);
        if(!data){ return null; }

        data.response = ("response" in updateDto) ? updateDto.response : null
        data.is_success = updateDto.is_success
        data.save()

        return data
    }

    async delete(id: string) {
        return await this.messageModel.destroy({ where:{ id : id } })
    }
}
