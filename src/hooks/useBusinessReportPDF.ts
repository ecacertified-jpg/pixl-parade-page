import { useState, useCallback } from 'react';
import {
  createPDF,
  addCoverPage,
  addHeader,
  addFooter,
  addSectionTitle,
  addKPIGrid,
  addChartImage,
  addTable,
  formatCurrency,
  formatDate,
  formatMonth,
  downloadPDF,
} from '@/utils/pdfExportUtils';
import type { BusinessDetailedStats } from '@/hooks/useBusinessDetailedStats';

export interface ReportConfig {
  includeKPIs: boolean;
  includeRevenueByType: boolean;
  includeMonthlyTrends: boolean;
  includeTopPerformers: boolean;
  includeProductCategories: boolean;
  orientation: 'portrait' | 'landscape';
}

const DEFAULT_CONFIG: ReportConfig = {
  includeKPIs: true,
  includeRevenueByType: true,
  includeMonthlyTrends: true,
  includeTopPerformers: true,
  includeProductCategories: true,
  orientation: 'portrait',
};

export function useBusinessReportPDF(stats: BusinessDetailedStats | null) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateReport = useCallback(async (config: ReportConfig = DEFAULT_CONFIG) => {
    if (!stats) {
      console.error('No stats available for report generation');
      return;
    }

    setGenerating(true);
    setProgress(0);

    try {
      const doc = createPDF({ orientation: config.orientation });
      const now = new Date();
      const dateStr = formatDate(now);
      const periodStr = formatMonth(now);
      
      let totalPages = 1; // Cover page
      if (config.includeKPIs) totalPages++;
      if (config.includeRevenueByType) totalPages++;
      if (config.includeMonthlyTrends) totalPages++;
      if (config.includeTopPerformers) totalPages++;
      if (config.includeProductCategories) totalPages++;

      let currentPage = 0;

      // Page 1: Cover
      currentPage++;
      setProgress((currentPage / totalPages) * 100);
      addCoverPage(
        doc,
        'RAPPORT BUSINESS',
        'Statistiques & Performances',
        periodStr,
        dateStr
      );

      // Page 2: KPIs
      if (config.includeKPIs) {
        doc.addPage();
        currentPage++;
        setProgress((currentPage / totalPages) * 100);
        
        addHeader(doc, 'Indicateurs Clés', currentPage, totalPages);
        
        let y = addSectionTitle(doc, 'Résumé des KPIs', 25, '📊');
        
        const avgProductsPerBusiness = stats.totalBusinesses > 0 
          ? stats.totalProducts / stats.totalBusinesses 
          : 0;
        
        const kpis = [
          { label: 'Business Total', value: stats.totalBusinesses.toString(), icon: '🏪' },
          { label: 'Business Actifs', value: stats.activeBusinesses.toString(), icon: '✅' },
          { label: 'Business Vérifiés', value: stats.verifiedBusinesses.toString(), icon: '🛡️' },
          { label: 'Revenus Totaux', value: formatCurrency(stats.totalRevenue), icon: '💰' },
          { label: 'Commandes', value: stats.totalOrders.toString(), icon: '📦' },
          { label: 'Panier Moyen', value: formatCurrency(stats.avgOrderValue), icon: '🛒' },
          { label: 'Produits', value: stats.totalProducts.toString(), icon: '🎁' },
          { label: 'Revenus/Business', value: formatCurrency(stats.avgRevenuePerBusiness), icon: '📈' },
          { label: 'Produits/Business', value: avgProductsPerBusiness.toFixed(1), icon: '📋' },
        ];
        
        addKPIGrid(doc, kpis, y);
        addFooter(doc, dateStr);
      }

      // Page 3: Revenue by Type
      if (config.includeRevenueByType) {
        doc.addPage();
        currentPage++;
        setProgress((currentPage / totalPages) * 100);
        
        addHeader(doc, 'Revenus par Type', currentPage, totalPages);
        
        let y = addSectionTitle(doc, 'Répartition des Revenus', 25, '💰');
        
        // Wait for chart capture
        await new Promise(resolve => setTimeout(resolve, 500));
        y = await addChartImage(doc, 'pdf-revenue-chart', y, 70);
        
        // Add legend table
        y = addSectionTitle(doc, 'Détails par Type', y, '📋');
        
        const revenueHeaders = ['Type', 'Business', 'Revenus', 'Part'];
        const revenueRows = stats.revenueByType.map(item => [
          item.type,
          item.businessCount.toString(),
          formatCurrency(item.revenue),
          `${item.percentage.toFixed(1)}%`
        ]);
        
        addTable(doc, revenueHeaders, revenueRows, y);
        addFooter(doc, dateStr);
      }

      // Page 4: Monthly Trends
      if (config.includeMonthlyTrends) {
        doc.addPage();
        currentPage++;
        setProgress((currentPage / totalPages) * 100);
        
        addHeader(doc, 'Tendances Mensuelles', currentPage, totalPages);
        
        let y = addSectionTitle(doc, 'Évolution sur 12 mois', 25, '📈');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        y = await addChartImage(doc, 'pdf-trends-chart', y, 70);
        
        // Summary stats
        const totalMonthlyRevenue = stats.monthlyTrends.reduce((sum, m) => sum + m.revenue, 0);
        const totalMonthlyOrders = stats.monthlyTrends.reduce((sum, m) => sum + m.orders, 0);
        const totalNewBusinesses = stats.monthlyTrends.reduce((sum, m) => sum + m.newBusinesses, 0);
        
        const summaryKpis = [
          { label: 'Revenus Période', value: formatCurrency(totalMonthlyRevenue), icon: '💰' },
          { label: 'Commandes', value: totalMonthlyOrders.toString(), icon: '📦' },
          { label: 'Nouveaux Business', value: `+${totalNewBusinesses}`, icon: '🆕' },
        ];
        
        addKPIGrid(doc, summaryKpis, y);
        addFooter(doc, dateStr);
      }

      // Page 5: Top Performers
      if (config.includeTopPerformers) {
        doc.addPage();
        currentPage++;
        setProgress((currentPage / totalPages) * 100);
        
        addHeader(doc, 'Top Performers', currentPage, totalPages);
        
        let y = addSectionTitle(doc, 'Top 10 Business par Revenus', 25, '🏆');
        
        const topHeaders = ['Rang', 'Business', 'Type', 'Revenus', 'Commandes', 'Note'];
        const topRows = stats.topBusinessByRevenue.slice(0, 10).map((business, index) => [
          `#${index + 1}`,
          business.name.substring(0, 20),
          business.type || '-',
          formatCurrency(business.revenue),
          business.orders.toString(),
          business.rating ? `${business.rating.toFixed(1)}★` : '-'
        ]);
        
        y = addTable(doc, topHeaders, topRows, y);
        
        // Top by orders
        y = addSectionTitle(doc, 'Top 5 par Volume de Commandes', y, '📦');
        
        const orderHeaders = ['Rang', 'Business', 'Commandes', 'Revenus'];
        const orderRows = stats.topBusinessByOrders.slice(0, 5).map((business, index) => [
          `#${index + 1}`,
          business.name.substring(0, 25),
          business.orders.toString(),
          formatCurrency(business.revenue)
        ]);
        
        addTable(doc, orderHeaders, orderRows, y);
        addFooter(doc, dateStr);
      }

      // Page 6: Product Categories
      if (config.includeProductCategories) {
        doc.addPage();
        currentPage++;
        setProgress((currentPage / totalPages) * 100);
        
        addHeader(doc, 'Catégories Produits', currentPage, totalPages);
        
        let y = addSectionTitle(doc, 'Répartition par Catégorie', 25, '🏷️');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        y = await addChartImage(doc, 'pdf-categories-chart', y, 70);
        
        // Category table
        y = addSectionTitle(doc, 'Détails des Catégories', y, '📊');
        
        const catHeaders = ['Catégorie', 'Produits', 'Revenus', 'Part'];
        const catRows = stats.productCategoryStats.slice(0, 8).map(cat => [
          cat.category.substring(0, 20),
          cat.productCount.toString(),
          formatCurrency(cat.totalRevenue),
          stats.totalRevenue > 0 ? `${((cat.totalRevenue / stats.totalRevenue) * 100).toFixed(1)}%` : '0%'
        ]);
        
        addTable(doc, catHeaders, catRows, y);
        addFooter(doc, dateStr);
      }

      // Generate filename and download
      const filename = `rapport_business_${now.toISOString().split('T')[0]}.pdf`;
      downloadPDF(doc, filename);
      
      setProgress(100);
    } catch (error) {
      console.error('Error generating PDF report:', error);
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  }, [stats]);

  return { generateReport, generating, progress };
}
