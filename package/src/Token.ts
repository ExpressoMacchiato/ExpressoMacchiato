import crypto from 'crypto';
import { Request } from 'express';
import jose from 'node-jose';
import { DefaultTokenPayload, TokenConstructor } from '../types/token.sptypes';

export class Token<Payload extends Record<string, any> = DefaultTokenPayload>
{
    private SECRET_KEY;
    private ExpTime;
    private EncAlgorithm;
    private KeyLength;

    private keyStore: jose.JWK.KeyStore | null = null;
    constructor (tokenPayload:TokenConstructor)
    {
        if (!tokenPayload.SECRET_KEY) throw new Error('SECRET_KEY is required if you want to use the Token Class');
        this.SECRET_KEY = tokenPayload.SECRET_KEY;
        this.ExpTime = tokenPayload.ExpTime
        this.EncAlgorithm = tokenPayload.EncAlgorithm
        this.KeyLength = tokenPayload.KeyLength
    }

    // Inizializza la KeyStore
    private async getKey(): Promise<jose.JWK.Key>
    {
        if (!this.keyStore)
        {
            this.keyStore = jose.JWK.createKeyStore();
            const encryptionKey = this.deriveEncryptionKey();
            const key = await jose.JWK.asKey({
                kty: 'oct',
                k: jose.util.base64url.encode(encryptionKey)
            });

            await this.keyStore.add(key);
        }

        return this.keyStore.all({ use: 'enc' })[0];
    }

    // Metodo per autorizzare una richiesta
    public authorize = async (req: Request | string):Promise<Payload> =>
    {
        if (typeof req === 'string')
        {
            const payload = await this.verifyJWE(req);
            return payload;
        }

        const token = req.headers.authorization?.split('Bearer ')?.[1] ?? null;
        if (token === null) throw new Error('UNAUTH');

        const payload = await this.verifyJWE(token);
        return payload;
    }

    // Metodo per derivare chiave di cifratura
    private deriveEncryptionKey(): Buffer
    {
        return crypto
            .createHash('sha256')
            .update(this.SECRET_KEY)
            .digest()
            .slice(0, this.KeyLength);
    }

    // Metodo per generare token cifrato (JWE)
    public async generateJWE(payload: Payload): Promise<string>
    {
        const key = await this.getKey();

        const input = Buffer.from(JSON.stringify({
            ...payload,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + this.ExpTime
        }));

        const jwe = await jose.JWE.createEncrypt({
            format: 'compact',
            fields: { alg: 'dir', enc: this.EncAlgorithm }
        }, key)
        .update(input)
        .final();

        return jwe;
    }

    // Metodo per decifrare token JWE
    public async verifyJWE(token: string): Promise<Payload>
    {
        try {
            const key = await this.getKey();
            const result = await jose.JWE.createDecrypt(key).decrypt(token);

            const payload = JSON.parse(result.plaintext.toString());

            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
                throw new Error('Token expired');
            }

            return payload;
        }
        catch (error)
        {
            throw new Error('Token decryption failed');
        }
    }
}
