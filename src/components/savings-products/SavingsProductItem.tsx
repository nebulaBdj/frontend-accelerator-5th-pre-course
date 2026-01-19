import { SavingsProduct } from 'api/savings-products/types';
import { ListRow, colors } from 'tosslib';
import { formatNumberToKo } from 'utils/formatting';

interface SavingsProductItemProps {
  product: SavingsProduct;
}

export default function SavingsProductItem({ product }: SavingsProductItemProps) {
  return (
    <ListRow.Texts
      type="3RowTypeA"
      top={product.name}
      topProps={{ fontSize: 16, fontWeight: 'bold', color: colors.grey900 }}
      middle={`연 이자율: ${product.annualRate}%`}
      middleProps={{ fontSize: 14, color: colors.blue600, fontWeight: 'medium' }}
      bottom={`${formatNumberToKo(product.minMonthlyAmount)}원 ~ ${formatNumberToKo(product.maxMonthlyAmount)}원 | ${product.availableTerms}개월`}
      bottomProps={{ fontSize: 13, color: colors.grey600 }}
    />
  );
}
