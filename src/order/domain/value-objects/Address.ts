import { ValueObject } from '../../../shared/domain/value-objects/ValueObject';

interface AddressProps {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export class Address extends ValueObject<AddressProps> {
  constructor(props: AddressProps) {
    super(props);
    this.validate();
  }

  private validate(): void {
    const value = this.getValue();
    if (!value.street) {
      throw new Error('Street is required');
    }
    if (!value.number) {
      throw new Error('Number is required');
    }
    if (!value.neighborhood) {
      throw new Error('Neighborhood is required');
    }
    if (!value.city) {
      throw new Error('City is required');
    }
    if (!value.state) {
      throw new Error('State is required');
    }
    if (!value.country) {
      throw new Error('Country is required');
    }
    if (!value.zipCode) {
      throw new Error('Zip code is required');
    }
    // Validações adicionais
    if (value.street.length < 3) {
      throw new Error('Street must be at least 3 characters long');
    }
    if (value.zipCode.length < 5) {
      throw new Error('Zip code must be at least 5 characters long');
    }
  }

  get street(): string {
    return this.getValue().street;
  }

  get number(): string {
    return this.getValue().number;
  }

  get complement(): string | undefined {
    return this.getValue().complement;
  }

  get neighborhood(): string {
    return this.getValue().neighborhood;
  }

  get city(): string {
    return this.getValue().city;
  }

  get state(): string {
    return this.getValue().state;
  }

  get country(): string {
    return this.getValue().country;
  }

  get zipCode(): string {
    return this.getValue().zipCode;
  }

  override toString(): string {
    const parts = [
      this.street,
      this.number,
      this.complement,
      this.neighborhood,
      this.city,
      this.state,
      this.country,
      this.zipCode
    ].filter(Boolean);

    return parts.join(', ');
  }
} 