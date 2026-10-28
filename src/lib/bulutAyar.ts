/*
 * Supabase bağlantısı. Bu iki değer tarayıcıda çalışmak için tasarlanmıştır ve uygulamaya
 * gömülmesi güvenlidir: verileri satır düzeyi güvenlik (izinli e-posta) korur.
 * Gizli anahtar (secret / service_role) ve veritabanı şifresi ASLA buraya yazılmaz.
 */
export const BULUT_ADRESI: string = '' // Supabase proje adresi: kullanıcı projeyi açınca doldurulacak
export const BULUT_ANAHTARI: string = '' // publishable key: kullanıcı gönderince doldurulacak

/* Google ile giriş Supabase'de açılınca true yapılır. O zamana kadar yalnız e-posta + şifre. */
export const GOOGLE_GIRISI: boolean = false

export const bulutHazir = (): boolean => BULUT_ADRESI.startsWith('https://') && BULUT_ANAHTARI.length > 20
