import {v4 as uuid} from "uuid";
import {ValidationError} from "../utils/errors";
import {pool} from "../utils/db";
import {GiftEntity} from "../interfaces/GiftEntity";
import {FieldPacket} from "mysql2";


type GiftRecordResults = [GiftRecord[], FieldPacket[]];

export class GiftRecord implements GiftEntity {
    public id?: string;
    public name: string;
    public count: number;

    constructor(obj: GiftEntity) {
        if (!obj.name || obj.name.length < 3 || obj.name.length > 55) {
            throw new ValidationError('Nazwa prezentu musi mieć między 3 a 55 znaków!');
        }
        if (!obj.count || obj.count < 1 || obj.count > 999999) {
            throw new ValidationError('Ilość (sztuk) prezentów powinna mieścić w przedziale między 1 - 999999.');
        }
        this.id = obj.id;
        this.name = obj.name;
        this.count = obj.count;
    }

    async insert(): Promise<string> {
        if (!this.id) {
            this.id = uuid();
        }
        await pool.execute("INSERT INTO gifts values(:id, :name, :count)", {
            id: this.id,
            name: this.name,
            count: this.count,
        });
        return this.id;
    }

    static async listAll(): Promise<GiftRecord[]> {
        const [results] = await pool.execute("SELECT * FROM gifts") as GiftRecordResults;
        return results.map(obj => new GiftRecord(obj));
    }

    static async getOne(id: string): Promise<GiftRecord | null> {
        const [results] = await pool.execute("SELECT * FROM `gifts` WHERE `id` = :id", {
            id,
        }) as GiftRecordResults;
        // Jeśli długość rezultatu zapytania jest zero, to zwracam null a jak nie to pierwsze z tablicy rezultatów.
        // Pierwsze, ponieważ zapytanie zwraca wszystko* w postaci tablicy.
        return results.length === 0? null: new GiftRecord(results[0]);
    }

    async countGivenGifts(): Promise<number> {
        const [[{count}]]  /*count[0][0].count */ =
            await pool.execute("SELECT COUNT(*) as count FROM children WHERE giftId = :id", {
           id: this.id,
        }) as GiftRecordResults;
        return count;
    }

}
