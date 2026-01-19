import { useQuery } from '@tanstack/react-query';
import { savingsProductQueryOptions } from 'api/savings-products/savingsProductsQueryOption';
import { SavingsProduct } from 'api/savings-products/types';
import CalculattionResultListItem from 'components/savings-products/CalculationResultListItem';
import SavingsProductItem from 'components/savings-products/SavingsProductItem';
import { useState } from 'react';
import {
  Assets,
  Border,
  ListHeader,
  ListRow,
  NavigationBar,
  SelectBottomSheet,
  Spacing,
  Tab,
  TextField,
} from 'tosslib';
import { calculateExpectedProfit, calculateSuggestMonthlyPayment, diff } from 'utils/calculate';
import { formatNumberToKo } from 'utils/formatting';
import { parseFormattedNumber } from 'utils/parse';
import { isMonthlyPaymentInRange, isTermMatching } from 'utils/savings-filter';

export function SavingsCalculatorPage() {
  const { data: savingsProducts = [] } = useQuery(savingsProductQueryOptions());

  const [selectedSavingsProduct, setSelectedSavingsProduct] = useState<SavingsProduct>();
  const [tabValue, setTabValue] = useState<string>('products');

  const [targetAmount, setTargetAmount] = useState<number>();
  const [monthlyPayment, setMonthlyPayment] = useState<number>();
  const [availableTerms, setAvailableTerms] = useState<number>();

  const hasAllFilterValues = monthlyPayment !== undefined && availableTerms !== undefined && targetAmount !== undefined;

  const joinAvailableProducts = savingsProducts.filter(product => {
    return isMonthlyPaymentInRange(monthlyPayment, product) && isTermMatching(availableTerms, product);
  });

  return (
    <>
      <NavigationBar title="적금 계산기" />
      <Spacing size={16} />

      <TextField
        label="목표 금액"
        placeholder="목표 금액을 입력하세요"
        suffix="원"
        value={formatNumberToKo(targetAmount)}
        onChange={e => setTargetAmount(parseFormattedNumber(e.target.value))}
      />

      <Spacing size={16} />

      <TextField
        label="월 납입액"
        placeholder="희망 월 납입액을 입력하세요"
        suffix="원"
        value={formatNumberToKo(monthlyPayment)}
        onChange={e => setMonthlyPayment(parseFormattedNumber(e.target.value))}
      />

      <Spacing size={16} />

      <SelectBottomSheet
        label="저축 기간"
        title="저축 기간을 선택해주세요"
        value={availableTerms}
        onChange={setAvailableTerms}
      >
        <SelectBottomSheet.Option value={6}>6개월</SelectBottomSheet.Option>
        <SelectBottomSheet.Option value={12}>12개월</SelectBottomSheet.Option>
        <SelectBottomSheet.Option value={24}>24개월</SelectBottomSheet.Option>
      </SelectBottomSheet>

      <Spacing size={24} />
      <Border height={16} />
      <Spacing size={8} />

      <Tab onChange={setTabValue}>
        <Tab.Item value="products" selected={tabValue === 'products'}>
          적금 상품
        </Tab.Item>
        <Tab.Item value="results" selected={tabValue === 'results'}>
          계산 결과
        </Tab.Item>
      </Tab>

      {tabValue === 'products' &&
        (() => {
          const displayProducts = hasAllFilterValues ? joinAvailableProducts : savingsProducts;

          return displayProducts.length > 0 ? (
            <>
              {displayProducts.map(product => (
                <ListRow
                  key={product.id}
                  contents={<SavingsProductItem product={product} />}
                  right={
                    isSelected(product.id, selectedSavingsProduct?.id) && <Assets.Icon name="icon-check-circle-green" />
                  }
                  onClick={() => setSelectedSavingsProduct(product)}
                />
              ))}
            </>
          ) : (
            <>
              <Spacing size={10} />
              <ListRow contents={<ListRow.Texts type="1RowTypeA" top="상품이 존재하지 않습니다." />} />
            </>
          );
        })()}

      {tabValue === 'results' && (
        <>
          {selectedSavingsProduct && targetAmount && monthlyPayment ? (
            (() => {
              const expoectedProfit = calculateExpectedProfit({
                availableTerms: selectedSavingsProduct.availableTerms,
                annualRate: selectedSavingsProduct.annualRate,
                monthlyPayment,
              });

              const diffFromTargetAmount = diff(targetAmount, expoectedProfit);

              const suggestMonthlyPayment = calculateSuggestMonthlyPayment({
                availableTerms: selectedSavingsProduct.availableTerms,
                annualRate: selectedSavingsProduct.annualRate,
                targetAmount,
              });

              return (
                <>
                  <ListRow
                    contents={
                      <CalculattionResultListItem
                        listLabel={'예상 수익 금액'}
                        calculationResult={`${expoectedProfit.toLocaleString('ko-KR')}원`}
                      />
                    }
                  />
                  <ListRow
                    contents={
                      <CalculattionResultListItem
                        listLabel={'목표 금액과의 차이'}
                        calculationResult={`${diffFromTargetAmount.toLocaleString('ko-KR')}원`}
                      />
                    }
                  />
                  <ListRow
                    contents={
                      <CalculattionResultListItem
                        listLabel={'추천 월 납입 금액'}
                        calculationResult={`${suggestMonthlyPayment.toLocaleString('ko-KR')}원`}
                      />
                    }
                  />
                </>
              );
            })()
          ) : (
            <>
              <Spacing size={10} />
              <ListRow contents={<ListRow.Texts type="1RowTypeA" top="상품을 선택해주세요." />} />
            </>
          )}

          <Spacing size={8} />
          <Border height={16} />
          <Spacing size={8} />

          <ListHeader title={<ListHeader.TitleParagraph fontWeight="bold">추천 상품 목록</ListHeader.TitleParagraph>} />
          <Spacing size={12} />

          {joinAvailableProducts.length > 0 ? (
            takeTopTwo([...joinAvailableProducts].sort(sortByAnnualRateDesc)).map(product => {
              return (
                <ListRow
                  key={product.id}
                  contents={<SavingsProductItem product={product} />}
                  right={
                    isSelected(product.id, selectedSavingsProduct?.id) && <Assets.Icon name="icon-check-circle-green" />
                  }
                  onClick={() => setSelectedSavingsProduct(product)}
                />
              );
            })
          ) : (
            <ListRow
              contents={<ListRow.Texts type="1RowTypeA" top="상품이 존재하지 않습니다. 입력값을 모두 입력해주세요." />}
            />
          )}
        </>
      )}
    </>
  );
}

const sortByAnnualRateDesc = (productA: SavingsProduct, productB: SavingsProduct) => {
  return productB.annualRate - productA.annualRate;
};

const takeTopTwo = (list: SavingsProduct[]) => {
  return list.slice(0, 2);
};

const isSelected = (productId: string | undefined, selectedProductId: string | undefined) => {
  return productId === selectedProductId;
};
