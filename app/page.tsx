'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getMockData } from './mock_data'; // mock_data에서 함수 임포트

interface MockData {
  productId: string;
  productName: string;
  price: number;
  boughtDate: string;
}

const Page: React.FC = () => {
  // 함수형 컴포넌트 사용
  const [data, setData] = useState<MockData[]>([]); // 데이터를 저장할 상태
  const [page, setPage] = useState(1); // 페이지 번호 상태
  const [totalPrice, setTotalPrice] = useState(0); // 총 가격 상태
  const [loading, setLoading] = useState(false); // 로딩 상태
  const [isEnd, setIsEnd] = useState(false); // 더 이상 데이터가 없는지 상태

  const observerRef = useRef<IntersectionObserver | null>(null); // 마지막 상품이 화면에 보이는지를 감지하고, 보이면 데이터를 추가로 불러온다
  const lastItemRef = useRef<HTMLDivElement | null>(null);

  // 데이터를 불러오는 함수
  const loadMoreData = useCallback(async () => {
    // 리렌더링 방지
    if (loading || isEnd) return; // 로딩 중이거나 더 이상 데이터가 없으면 종료

    setLoading(true); // 로딩 시작
    const response = await getMockData(page); // 비동기로 데이터 불러오기
    const { datas, isEnd: newIsEnd } = response as {
      datas: MockData[];
      isEnd: boolean;
    };

    if (newIsEnd) {
      setIsEnd(true);
    } else {
      setData((prevData) => [...prevData, ...datas]); // 기존 데이터에 새 데이터 추가
      setTotalPrice(
        // 가격 총합 업데이트
        (prevTotal) =>
          prevTotal + datas.reduce((sum, item) => sum + item.price, 0),
      );
      setPage((prevPage) => prevPage + 1); // 다음 페이지 번호 설정
    }

    setLoading(false); // 로딩 끝
  }, [page, loading, isEnd]);

  // Intersection Observer 설정
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect(); // 기존 observer 해제

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !isEnd) {
          loadMoreData(); // 마지막 아이템이 뷰포트에 들어오면 데이터 로딩
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 1.0, // 100% 보여지면 트리거
      },
    );

    if (lastItemRef.current) {
      observerRef.current.observe(lastItemRef.current); // 마지막 아이템 감시 시작
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect(); // cleanup
    };
  }, [loading, isEnd, loadMoreData]);

  return (
    <div className="max-w-2xl mx-auto my-5 p-5 bg-gray-100 rounded-lg shadow-lg">
      <h1 className="text-center mb-5 text-2xl text-gray-800">상품 리스트</h1>
      <ul className="list-none p-0">
        {data.map((item) => (
          <li
            key={item.productId}
            className="flex justify-between p-3 border-b border-gray-300"
          >
            <span>
              {item.productName} {item.price}원
            </span>
            <span className="italic">
              {' '}
              {new Date(item.boughtDate).toISOString().split('T')[0]}{' '}
            </span>
          </li>
        ))}
      </ul>

      {/* 가격 총합 */}
      <div className="mt-5 text-right text-lg font-bold">
        <strong>총 가격:</strong> {totalPrice}원
      </div>

      {/* 로딩 중일 때 보여줄 UI */}
      {loading && <div className="text-center text-blue-500">로딩 중...</div>}

      {/* 더 이상 불러올 데이터가 없을 때 */}
      {isEnd && (
        <div className="text-center text-red-500">
          더 이상 불러올 데이터가 없습니다.
        </div>
      )}

      {/* Intersection Observer가 감시할 마지막 아이템 */}
      <div ref={lastItemRef}></div>
    </div>
  );
};

export default Page;
