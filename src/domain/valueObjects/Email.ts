export class Email {
  private readonly value: string;

  constructor(email: string) {
    if (!email.includes('@')) {
      throw new Error('El correo debe contener @');
    }
    this.value = email;
  }

  toString(): string {
    return this.value;
  }
}
